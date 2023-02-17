import path from 'node:path';
/**
 * path of the SoundVolumeView.exe
 */
export const SVV_CMD = path.join(__dirname, '..', 'public/SoundVolumeView.exe');

export const SOUND_ITEMS_PATH = path.join(__dirname, '..', 'public/sound-items.json');

export const SAVE_SOUND_ITEMS_CMD = `/SaveFileEncoding 3 /sjson "${SOUND_ITEMS_PATH}"`;

export const MUTE_CMD = '/Mute';

export const UNMUTE_CMD = '/Unmute';

export const SET_DEFAULT_CMD = '/SetDefault';

