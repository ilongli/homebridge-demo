import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';

import {
  getVolumeByItemId,
  setVolumeByItemId,
  muteByItemId,
  unMuteByItemId,
  switchSpeakerByItemId,
} from './cmd-utils';


/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private states = {
    Mute: false,
    Volume: 100,
    On: false,
    Brightness: 0,
    CurrentMediaState: this.platform.Characteristic.CurrentMediaState.PLAY,
    TargetMediaState: this.platform.Characteristic.TargetMediaState.PLAY,
  };

  private itemId: string;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.itemId = accessory.context.device['Item ID'];

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device['Device Name'])
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device['Device Name'])
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device['Item ID']);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory


    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    // this.service = this.accessory.getService(this.platform.Service.Speaker) || this.accessory.addService(this.platform.Service.Speaker);


    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device['Name']);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    /*     this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));    */

    /*     this.service.getCharacteristic(this.platform.Characteristic.CurrentMediaState)
      .onGet(this.getCurrentMediaState.bind(this));


    this.service.getCharacteristic(this.platform.Characteristic.TargetMediaState)
      .onGet(this.getTargetMediaState.bind(this))
      .onSet(this.setTargetMediaState.bind(this));
 */
    /*     this.service.getCharacteristic(this.platform.Characteristic.Mute)
      .onGet(this.getMute.bind(this))
      .onSet(this.setMute.bind(this)); */

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getActive.bind(this))
      .onSet(this.setActive.bind(this));


    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onGet(this.getVolume.bind(this))
      .onSet(this.setVolume.bind(this));

  }


  async getCurrentMediaState(): Promise<CharacteristicValue> {
    const currentMediaState = this.states.CurrentMediaState;

    this.platform.log.debug('Get Characteristic getCurrentMediaState ->', currentMediaState);

    return currentMediaState;
  }


  async getTargetMediaState(): Promise<CharacteristicValue> {
    const targetMediaState = this.states.TargetMediaState;

    this.platform.log.debug('Get Characteristic TargetMediaState ->', targetMediaState);

    return targetMediaState;
  }

  async setTargetMediaState(value: CharacteristicValue) {
    this.states.TargetMediaState = value as number;

    this.platform.log.debug('Set Characteristic TargetMediaState ->', value);
  }

  async getMute(): Promise<CharacteristicValue> {
    const isMute = this.states.Mute;

    this.platform.log.debug('Get Characteristic Mute ->', isMute);

    return isMute;
  }

  async setMute(value: CharacteristicValue) {
    this.states.Mute = value as boolean;

    this.platform.log.debug('Set Characteristic Mute ->', value);
  }


  async setActive(value: CharacteristicValue) {

    const isOn = value as boolean;

    this.platform.log.debug(`[${this.accessory.displayName}]Set Active ->`, isOn);

    if (isOn) {
      // 切换到这个speaker
      // switch the this speaker
      switchSpeakerByItemId(this.itemId);
      unMuteByItemId(this.itemId);
      this.platform.updateDevicesState(this.accessory);
    } else {
      // TODO，如果是off，相当于将其静音
      muteByItemId(this.itemId);
    }



  }

  async getActive(): Promise<CharacteristicValue> {
    const isActive = this.platform.defaultSpeakerUUID === this.accessory.UUID;

    this.platform.log.debug(`[${this.accessory.displayName}]Set Active ->`, isActive);

    return isActive;
  }

  async getVolume(): Promise<CharacteristicValue> {
    // const volume = this.states.Volume;
    const volume = getVolumeByItemId(this.itemId);
    this.platform.log.debug(`[${this.accessory.displayName}]Get Volume ->`, volume);
    return volume;
  }

  async setVolume(value: CharacteristicValue) {
    // this.states.Volume = value as number;
    setVolumeByItemId(this.itemId, value as number);
    this.platform.log.debug(`[${this.accessory.displayName}]Set Volume ->`, value);
  }

}
