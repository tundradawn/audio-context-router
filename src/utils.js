export const createAudioElement = (stream) => {
  const audio = new window.Audio();

  audio.srcObject = stream;

  return audio;
};

export const mapChannels = (channels) => {

  // Map channels from [0, 1] to [1, 2]
  return Array.from({ length: channels }).map((v, i) => i + 1);
};

export default {
  createAudioElement,
  mapChannels
};
