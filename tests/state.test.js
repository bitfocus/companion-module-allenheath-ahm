import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { initContext } from '../src/context.js'
import { trackAHMParams } from '../src/state/AHMState.js'
import { ChannelType } from '../src/utility/constants.js'

let state
beforeEach(() => {
	state = trackAHMParams()
	initContext({ state, companion: { log() {} } })
})

for (const type of Object.values(ChannelType)) {
	test(`channel type ${type}: subscriptions are idempotent and independently removed`, () => {
		assert.equal(state.addChannel(type, 1, 'a', 'level').isNew, true)
		assert.equal(state.addChannel(type, 1, 'a', 'level').isNew, false)
		state.addChannel(type, 1, 'b', 'mute')
		assert.equal(state.getTrackedChannelMap(type).get(1).subscriptions.size, 2)
		state.removeChannel('a')
		assert.equal(state.getTrackedChannelMap(type).size, 1)
		state.removeChannel('b')
		assert.equal(state.getTrackedChannelMap(type).size, 0)
	})
}

test('moving a channel feedback prunes its previous channel but preserves other subscribers', () => {
	state.addChannel(ChannelType.Input, 1, 'a', 'level')
	state.addChannel(ChannelType.Input, 1, 'b', 'mute')
	state.addChannel(ChannelType.Input, 2, 'a', 'level')
	assert.deepEqual([...state.getTrackedChannelMap(ChannelType.Input).get(1).subscriptions.keys()], ['b'])
	state.addChannel(ChannelType.Input, 3, 'a', 'level')
	assert.equal(state.getTrackedChannelMap(ChannelType.Input).has(2), false)
})

test('channel updates preserve omitted values and accept zero and false', () => {
	state.addChannel(ChannelType.Zone, 2, 'a', 'mute')
	state.setChannel(ChannelType.Zone, 2, 90, true)
	state.setChannel(ChannelType.Zone, 2, 0, undefined)
	assert.equal(state.getLevel(ChannelType.Zone, 2), 0)
	assert.equal(state.getMute(ChannelType.Zone, 2), true)
	state.setChannel(ChannelType.Zone, 2, undefined, false)
	assert.equal(state.getMute(ChannelType.Zone, 2), false)
	state.setChannel(ChannelType.Zone, 3, 90, true)
	assert.equal(state.getTrackedChannelMap(ChannelType.Zone).has(3), false)
})

test('manual tracking replacement preserves feedbacks and sources with tracked sends', () => {
	state.setManualTracking(ChannelType.Input, [1, 2, 3])
	state.addChannel(ChannelType.Input, 1, 'a', 'level')
	state.addSend(ChannelType.Input, 2, 4, 'b', 'send_level')
	state.setManualTracking(ChannelType.Input, [4])
	assert.deepEqual([...state.getTrackedChannelMap(ChannelType.Input).keys()], [1, 2, 4])
	assert.equal(state.isManuallyTracked(ChannelType.Input, 1), false)
	assert.equal(state.isManuallyTracked(ChannelType.Input, 4), true)
	state.setManualTracking(ChannelType.Input, [])
	assert.equal(state.getTrackedChannelMap(ChannelType.Input).has(4), false)
})

for (const type of [ChannelType.Input, ChannelType.Zone]) {
	test(`send type ${type}: shared subscription lifetime and response initialization`, () => {
		assert.equal(state.addSend(type, 1, 2, 'a', 'send_level').isNew, true)
		state.addSend(type, 1, 2, 'b', 'send_mute')
		state.setSend(type, 1, 2, 90, true)
		assert.equal(state.addSend(type, 1, 2, 'a', 'send_level').isNew, false)
		state.setSend(type, 1, 2, 0, undefined)
		assert.equal(state.getSendLevel(type, 1, 2), 0)
		assert.equal(state.getSendMute(type, 1, 2), true)
		state.setSend(type, 1, 2, undefined, false)
		assert.equal(state.getSendMute(type, 1, 2), false)
		state.removeSend('a')
		assert.equal(state.getTrackedSends(type).length, 1)
		state.removeSend('b')
		assert.equal(state.getTrackedChannelMap(type).size, 0)
	})
}

test('moving a send feedback removes the old send without losing channel tracking', () => {
	state.addChannel(ChannelType.Input, 1, 'channel', 'level')
	state.addSend(ChannelType.Input, 1, 2, 'send', 'send_level')
	state.addSend(ChannelType.Input, 3, 4, 'send', 'send_level')
	assert.equal(state.getTrackedChannelMap(ChannelType.Input).has(1), true)
	assert.deepEqual(
		state.getTrackedSends(ChannelType.Input).map(({ fromChNum, toChNum }) => [fromChNum, toChNum]),
		[[3, 4]],
	)
	state.setSend(ChannelType.Input, 9, 9, 50, true)
	assert.equal(state.getTrackedSends(ChannelType.Input).length, 1)
})

test('reset clears tracked channels, sends and preset; helpers continue to work', () => {
	state.addSend(ChannelType.Input, 1, 2, 'a', 'send_level')
	state.setPreset(12)
	assert.equal(state.getPreset(), 12)
	state.reset()
	for (const type of Object.values(ChannelType)) assert.equal(state.getTrackedChannelMap(type).size, 0)
	assert.equal(state.getPreset(), 0)
	state.addChannel(ChannelType.Input, 4, 'b', 'mute')
	state.setChannel(ChannelType.Input, 4, 40, true)
	assert.equal(state.getMute(ChannelType.Input, 4), true)
})
