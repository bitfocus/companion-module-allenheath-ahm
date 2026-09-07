import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initContext } from '../src/context.js'
import { trackAHMParams } from '../src/state/AHMState.js'
import { pollStateTimer } from '../src/client/pollState.js'
import { ChannelType, Priority } from '../src/utility/constants.js'

// Flush the bounded async chain: tick -> runTick -> timer continuation.
async function flush() {
	for (let i = 0; i < 8; i++) await Promise.resolve()
}

function setup(t, interval = 10000) {
	t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 100000 })
	const state = trackAHMParams()
	const requests = []
	const errors = []
	const socket = {
		queue: (buffers, priority) => requests.push({ hex: Buffer.concat(buffers).toString('hex'), priority }),
		isConnected: () => true,
		waitUntilIdle: async () => {},
	}
	initContext({ state, companion: { log() {} } })
	const poller = pollStateTimer(
		() => socket,
		interval,
		(error) => errors.push(error),
	)
	t.after(() => poller.stop())
	return { state, socket, requests, errors, poller }
}

test('polls each tracked channel and send once, with low-priority read requests', async (t) => {
	const { state, requests, poller } = setup(t)
	state.addChannel(ChannelType.Input, 1, 'a', 'level')
	state.addChannel(ChannelType.Input, 1, 'b', 'mute')
	state.addChannel(ChannelType.Zone, 2, 'c', 'level')
	state.addChannel(ChannelType.ControlGroup, 3, 'd', 'level')
	state.addSend(ChannelType.Input, 1, 2, 'e', 'send_level')
	state.addSend(ChannelType.Zone, 2, 3, 'f', 'send_mute')
	poller.start()
	poller.start()
	t.mock.timers.tick(0)
	await flush()
	assert.deepEqual(
		requests.map(({ hex }) => hex),
		[
			'f000001a5012010000010b1700f7',
			'f000001a5012010000010900f7',
			'f000001a5012010001010b1701f7',
			'f000001a5012010001010901f7',
			'f000001a5012010002010b1702f7',
			'f000001a5012010002010902f7',
			'f000001a5012010000010f02000101f7',
			'f000001a5012010000010f03000101f7',
			'f000001a5012010001010f02010102f7',
			'f000001a5012010001010f03010102f7',
		],
	)
	assert.ok(requests.every(({ priority }) => priority === Priority.LOW))
})

test('periodic polling respects the configured interval and stop cancels future work', async (t) => {
	const { state, requests, poller } = setup(t)
	state.addChannel(ChannelType.Input, 1, 'a', 'level')
	poller.start()
	t.mock.timers.tick(0)
	await flush()
	t.mock.timers.tick(9999)
	assert.equal(requests.length, 2)
	t.mock.timers.tick(1)
	await flush()
	assert.equal(requests.length, 4)
	poller.stop()
	poller.poll()
	t.mock.timers.tick(30000)
	await flush()
	assert.equal(requests.length, 4)
})

test('slow poll waits for queue drain plus cooldown before the next periodic tick', async (t) => {
	const { state, socket, requests, poller } = setup(t, 1000)
	state.addChannel(ChannelType.Input, 1, 'a', 'level')
	let drain
	socket.waitUntilIdle = () =>
		new Promise((resolve) => {
			drain = resolve
		})
	poller.start()
	t.mock.timers.tick(0)
	t.mock.timers.tick(5000)
	assert.equal(requests.length, 2)
	drain()
	await flush()
	t.mock.timers.tick(1999)
	assert.equal(requests.length, 2)
	socket.waitUntilIdle = async () => {}
	t.mock.timers.tick(1)
	await flush()
	assert.equal(requests.length, 4)
})

test('manual requests during a running poll coalesce into one follow-up', async (t) => {
	const { state, socket, requests, poller } = setup(t)
	state.addChannel(ChannelType.Input, 1, 'a', 'level')
	let drain
	socket.waitUntilIdle = () =>
		new Promise((resolve) => {
			drain = resolve
		})
	poller.start()
	t.mock.timers.tick(0)
	poller.poll()
	poller.poll()
	assert.equal(requests.length, 2)
	socket.waitUntilIdle = async () => {}
	drain()
	await flush()
	t.mock.timers.tick(0)
	await flush()
	assert.equal(requests.length, 4)
})

test('disconnected socket reports an error without queuing requests', async (t) => {
	const { socket, requests, errors, poller } = setup(t)
	socket.isConnected = () => false
	poller.start()
	t.mock.timers.tick(0)
	await flush()
	assert.equal(requests.length, 0)
	assert.equal(errors.length, 1)
	assert.match(errors[0].message, /not connected/)
})

test('stopping an in-flight poll prevents drain completion from restarting it', async (t) => {
	const { state, socket, requests, poller } = setup(t)
	state.addChannel(ChannelType.Input, 1, 'a', 'level')
	let drain
	socket.waitUntilIdle = () =>
		new Promise((resolve) => {
			drain = resolve
		})
	poller.start()
	t.mock.timers.tick(0)
	poller.poll()
	poller.stop()
	drain()
	await flush()
	t.mock.timers.tick(30000)
	await flush()
	assert.equal(requests.length, 2)
})
