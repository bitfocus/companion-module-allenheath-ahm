# Allen & Heath AHM

Controls the [Allen & Heath AHM](https://www.allen-heath.com/ahm-series/) series of audio matrix processors.

## Getting Started

Use the IP of your AHM unit from the AHM System Manager software or your networking controller in the module configuration along with which AHM is being controlled (AHM-16, AHM-32, AHM-64).

This module routinely requests channel data from the AHM every so often in order to keep Companion's variables up to date with other controllers connected to the AHM. Raise the refresh rate value to cut down on network traffic (10,000 ms = 10 sec). This module will request current levels and mutes outside of this interval if the user recalls a preset, or changes a level or mute of a channel.

## Toggle Mute

The input, zone, control group, and input-to-zone mute actions include an **Operation** choice. Select **Set mute state** to explicitly mute or unmute, or select **Toggle current state** to invert the live value reported by the AHM.

Toggle mode requests the current mute value before sending the opposite state. If the AHM does not answer within one second, the module logs an error and does not send a potentially incorrect mute command.

## Upgrade Notice

Users upgrading from the `2.x` module version should fill out the Manual Channel Tracking section on the connection configuration page with input, zone, and control group numbers they need global variables created for. In order to save startup time, this module no longer creates global variables for the level of every input, zone, and control group.

Level global variables are most likely used for button titles. There is no need to completely redo your setup, just input the input, zone, or control group number you need on the configuration page.

Moving forward, we recommend you create a local variable to use a feedback (level, mute state) on a single button. This does not generate a global variable.
