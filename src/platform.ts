import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SOUND_ITEMS_PATH } from './cmd';
import { ExamplePlatformAccessory } from './platformAccessory';

import { saveSoundItemFile } from './cmd-utils';

import fs from 'node:fs';
// import process from 'node:process';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public cacheAccessories: PlatformAccessory[] = [];

  // 目前正在使用的accessory
  public accessories: PlatformAccessory[] = [];

  public defaultSpeakerUUID = '';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {


    // TEST
    /*     this.log.error('------1:', process.execPath);
    this.log.error('------2:', __dirname);
    this.log.error('------3:', process.cwd()); */

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.cacheAccessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // get all speakers
    const speakers = this.getAllSpeakers();

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of speakers) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device['Item ID']);

      // 检查是否当前默认的speaker
      // check whether is the default speaker
      if (device['Default'] !== '') {
        this.defaultSpeakerUUID = uuid;
      }

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.cacheAccessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        existingAccessory.context.device = device;
        this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new ExamplePlatformAccessory(this, existingAccessory);

        // 缓存和目前存在的设备能匹配上，从this.accessories中删除
        this.cacheAccessories.splice(this.cacheAccessories.indexOf(existingAccessory), 1);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        this.accessories.push(existingAccessory);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device['Name']);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device['Name'], uuid);
        // accessory.category = 26;

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new ExamplePlatformAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        // this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
        this.accessories.push(accessory);
      }
    }

    // 没有匹配上的accessory删除掉
    if (this.cacheAccessories.length > 0) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.cacheAccessories);
      this.cacheAccessories = [];
    }
  }


  /**
   * get all speakers throught SoundVolumeView.exe
   * @see https://www.nirsoft.net/utils/sound_volume_view.html
   * @returns Array
   */
  getAllSpeakers() {
    try {
      saveSoundItemFile();
    } catch (error) {
      this.log.error('保存sound-item.json失败：', (<Buffer> error).toString());
      return [];
    }

    // 从sound-item.json中读取所有音频设备列表
    // get audio device list from sound-item.json
    let fileContent = fs.readFileSync(SOUND_ITEMS_PATH, 'utf8');
    this.log.debug('SOUND_ITEMS_PATH:', SOUND_ITEMS_PATH);
    fileContent = fileContent.replace(/^\uFEFF/, '');
    const soundItems = JSON.parse(fileContent) || [];

    // 筛选出所有speakers
    // filter all speakers
    const speakers = soundItems.filter((soundItem) => {
      return soundItem.Type === 'Device' && soundItem.Direction === 'Render';
    });

    this.log.debug('speakers:', speakers);

    return speakers;
  }


  updateDevicesState(accessory: PlatformAccessory) {

    const currentUUID = accessory.UUID;

    this.log.debug('updateDevicesState:', currentUUID);

    if (this.defaultSpeakerUUID === currentUUID) {
      return;
    }

    this.defaultSpeakerUUID = currentUUID;
    // 遍历所有speaker，更新其状态
    // iterate all speakers, update the state
    for (const speaker of this.accessories) {
      if (speaker.UUID !== currentUUID) {
        const service = speaker.getService(this.Service.Lightbulb);
        if (service) {
          service.updateCharacteristic(this.Characteristic.On, false);
        }
      }
    }
  }
}
