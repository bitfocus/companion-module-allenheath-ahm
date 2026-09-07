import assert from 'node:assert/strict'
import { EventEmitter, once } from 'node:events'
import { createServer } from 'node:net'
import { test } from 'node:test'
import { TCPClient } from '../src/client/TCP.js'
import { initContext } from '../src/context.js'
import { Priority } from '../src/utility/constants.js'

// Use the real TCPHelper against loopback only. TCP packet boundaries are not
// message boundaries, so assertions compare the concatenated byte stream.
async function connect(t) {
	const received = []
	const events = new EventEmitter()
	const peers = new Set()
	const server = createServer((peer) => {
		peers.add(peer)
		peer.on('close', () => peers.delete(peer))
		peer.on('data', (data) => {
			received.push(data)
			events.emit('data')
		})
	})
	const client = TCPClient()
	initContext({ companion: { log() {}, updateStatus() {} } })
	t.after(async () => {
		client.destroy()
		await client.waitUntilIdle()
		for (const peer of peers) peer.destroy()
		await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
	})
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	const connected = new Promise((resolve) => client.onConnected(resolve))
	client.init('127.0.0.1', server.address().port)
	await connected
	async function bytes(count) {
		while (Buffer.concat(received).length < count) await once(events, 'data')
		return Buffer.concat(received)
	}
	return { client, bytes, peers }
}

test('transport preserves buffer order and FIFO order for low-priority requests', { timeout: 5000 }, async (t) => {
	const { client, bytes } = await connect(t)
	assert.equal(client.isConnected(), true)
	client.queue([Buffer.from([1, 2]), Buffer.from([3])], Priority.LOW)
	client.queue([Buffer.from([4, 5])], Priority.LOW)
	await client.waitUntilIdle()
	assert.deepEqual(await bytes(5), Buffer.from([1, 2, 3, 4, 5]))
})

test(
	'a high-priority action precedes pending polling requests, not the active request',
	{ timeout: 5000 },
	async (t) => {
		const { client, bytes } = await connect(t)
		client.queue([Buffer.from([1])], Priority.LOW)
		client.queue([Buffer.from([2])], Priority.LOW)
		client.queue([Buffer.from([3])], Priority.HIGH)
		await client.waitUntilIdle()
		assert.deepEqual(await bytes(3), Buffer.from([1, 3, 2]))
	},
)

test(
	'clearing pending requests resolves every idle waiter without sending cancelled bytes',
	{ timeout: 5000 },
	async (t) => {
		const { client, bytes } = await connect(t)
		client.queue([Buffer.from([1])], Priority.LOW)
		client.queue([Buffer.from([2])], Priority.LOW)
		const idleA = client.waitUntilIdle()
		const idleB = client.waitUntilIdle()
		client.clearQueue()
		await Promise.all([idleA, idleB])
		// A later sentinel proves no cancelled byte preceded it on the same stream.
		client.queue([Buffer.from([3])], Priority.LOW)
		await client.waitUntilIdle()
		assert.deepEqual(await bytes(2), Buffer.from([1, 3]))
	},
)

for (const disconnect of ['end', 'resetAndDestroy']) {
	test(`${disconnect}: clears pending work and reconnects without replaying it`, { timeout: 8000 }, async (t) => {
		const { client, bytes, peers } = await connect(t)
		let notifications = 0
		const disconnected = new Promise((resolve) =>
			client.onDisconnect(() => {
				notifications++
				resolve()
			}),
		)
		const reconnected = new Promise((resolve) => client.onConnected(resolve))
		client.queue([Buffer.from([1])], Priority.LOW)
		await bytes(1)
		// Queue and disconnect in the same turn, before the 150 ms pacing timer.
		client.queue([Buffer.from([2])], Priority.LOW)
		for (const peer of peers) peer[disconnect]()
		await disconnected
		assert.equal(client.isConnected(), false)
		await client.waitUntilIdle()
		await reconnected
		assert.equal(client.isConnected(), true)
		client.queue([Buffer.from([3])], Priority.LOW)
		await client.waitUntilIdle()
		assert.deepEqual(await bytes(2), Buffer.from([1, 3]))
		assert.equal(notifications, 1)
	})
}
