import test from 'node:test'
import assert from 'node:assert/strict'

import { getActions, ActionId } from '../src/actions.js'
import { initContext } from '../src/context.js'
import { requestMuteInfo, setMute } from '../src/formatMIDI/channels.js'
import { trackAHMParams } from '../src/state/AHMState.js'
import { ChannelType } from '../src/utility/constants.js'

function createHarness() {
	const queued = []
	const checkedFeedbacks = []
	const logs = []
	const state = trackAHMParams()

	initContext({
		state,
		tcpClient: {
			queue: (command) => queued.push(command),
		},
		companion: {
			checkFeedbacks: (...feedbacks) => checkedFeedbacks.push(feedbacks),
			log: (level, message) => logs.push({ level, message }),
		},
		poller: null,
	})

	return {
		actions: getActions(16, 16, 32),
		checkedFeedbacks,
		logs,
		queued,
		state,
	}
}

test('mute actions expose set and toggle operations', () => {
	const { actions } = createHarness()
	for (const actionId of [ActionId.MuteInput, ActionId.MuteZone, ActionId.MuteControlGroup, ActionId.MuteInputToZone]) {
		const operation = actions[actionId].options.find((option) => option.id === 'operation')
		assert.equal(operation.default, 'set')
		assert.deepEqual(
			operation.choices.map((choice) => choice.id),
			['set', 'toggle'],
		)
	}
})

test('legacy mute actions without an operation still set the requested state', async () => {
	const { actions, queued } = createHarness()

	await actions[ActionId.MuteInput].callback({ options: { mute_number: 2, mute: false } })

	assert.equal(queued.length, 1)
	assert.deepEqual(queued[0], setMute(ChannelType.Input, 2, false))
})

test('toggle requests the live channel state and sends its inverse', async () => {
	const { actions, queued, state } = createHarness()

	const action = actions[ActionId.MuteInput].callback({
		options: { mute_number: 3, operation: 'toggle', mute: true },
	})

	assert.deepEqual(queued[0], requestMuteInfo(ChannelType.Input, 3))
	state.setChannel(ChannelType.Input, 3, undefined, true)
	await action

	assert.equal(queued.length, 2)
	assert.deepEqual(queued[1], setMute(ChannelType.Input, 3, false))
	assert.equal(state.getMute(ChannelType.Input, 3), false)
})

test('send mute waiters resolve from a tracked input-to-zone response', async () => {
	const { state } = createHarness()
	const pending = state.waitForSendMute(ChannelType.Input, 4, 5, 100)

	state.setSend(ChannelType.Input, 4, 5, undefined, true)

	assert.equal(await pending, true)
	assert.equal(state.getSendMute(ChannelType.Input, 4, 5), true)
})
