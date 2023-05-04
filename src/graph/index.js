import { INPUT_CHANNELS, OUTPUT_CHANNELS } from '../constants';
import { createAudioElement, mapChannels } from '../utils';

class AudioGraph {
  constructor(id, audioContext, config, useAudioElement) {
    this._id = id;
    this._config = config;
    this._audioContext = audioContext;
    this._useAudioElement = useAudioElement;
    this._audioElement = null;
    this._stream = null;
    this._playing = false;
    this._muted = false;

    this._nodes = {
      source: null,
      splitter: null,
      merger: null,
      gain: []
    };
  }

  _getNode(key, channelIndex = -1) {
    if (channelIndex !== -1) {
      return this._nodes[key] && this._nodes[key][channelIndex];
    }

    return this._nodes[key];
  }

  _setNode(key, node, channelIndex = -1) {
    if (channelIndex !== -1 && this._nodes[key]) {
      this._nodes[key][channelIndex] = node;
    } else {
      this._nodes[key] = node;
    }

    return node;
  }

  _getInputChannelIndex(channel) {
    return this.getInputChannels().indexOf(channel);
  }

  getInputChannels() {

    // Map channels from [0, 1] to [1, 2]
    return mapChannels(this._config.input.channels);
  }

  getOutputChannels() {

    // Map channels from [0, 1] to [1, 2]
    return mapChannels(this._config.output.channels);
  }

  getNode(key, channel) {
    const channelIndex = this._getInputChannelIndex(channel);

    return this._getNode(key, channelIndex);
  }

  setNode(key, node, channel) {
    const channelIndex = this._getInputChannelIndex(channel);

    return this._setNode(key, node, channel)
  }

  disconnect() {
    const source = this._getNode('source');
    const splitter = this._getNode('splitter');

    // Disconnect first node in audio graph (splitter) from source
    if (source && splitter) {
      source.disconnect(splitter);
    }

    this._setNode('source', null);
    this._setNode('splitter', null);
    this._setNode('merger', null);
    this._setNode('gain', null);
  }

  setStream(stream) {
    const source = this._audioContext.createMediaStreamSource(stream);
    const splitter = this._audioContext.createChannelSplitter(this._config.output.channels);
    const merger = this._audioContext.createChannelMerger(this._config.output.channels);
    const gains = this.getInputChannels().map(() => (
      this._audioContext.createGain()
    ));

    source.connect(splitter);

    gains.forEach((gain, inputIndex) => {
      splitter.connect(gain, inputIndex);
    });

    merger.connect(this._audioContext.destination);

    this.disconnect();

    // Previous source has been disconnected, we are no longer playing
    this._playing = false;
    this._stream = stream;

    this._setNode('source', source);
    this._setNode('splitter', splitter);
    this._setNode('merger', merger);
    this._setNode('gain', gains);
  }

  setGain(value, channel) {
    const channelIndex = this._getInputChannelIndex(channel);

    if (channelIndex === -1) {
      const gains = this._getNode('gain');

      gains.forEach((gain) => {
        gain.gain.setValueAtTime(value, this._audioContext.currentTime);
      });
    } else {
      const gain = this._getNode('gain', channelIndex);

      gain.gain.setValueAtTime(value, this._audioContext.currentTime);
    }
  }

  play(channel) {
    const channelIndex = this._getInputChannelIndex(channel);
    const merger = this._getNode('merger');

    if (this._playing) {
      return;
    }

    this._playing = true;

    // Play all channels
    if (channelIndex === -1) {
      const gains = this._getNode('gain');

      this.getOutputChannels().forEach((c, outputIndex) => {
        gains.forEach((gain) => {
          gain.connect(merger, 0, outputIndex);
        });
      });
    } else {
      const gain = this._getNode('gain', channelIndex);

      this.getOutputChannels().forEach((c, outputIndex) => {
        gain.connect(merger, 0, outputIndex);
      });
    }

    if (this._useAudioElement) {

      /**
       * Remote streams don't work with AudioContext API,
       * so we have to playback through an Audio element.
       *
       * See: https://bugs.chromium.org/p/chromium/issues/detail?id=121673
       */
      this._audioElement = createAudioElement(this._stream);

      this._audioElement.muted = true;
      this._audioElement.play();
    }
  }

  stop(channel) {
    const channelIndex = this._getInputChannelIndex(channel);
    const merger = this._getNode('merger');

    if (!this._playing) {
      return;
    }

    this._playing = false;

    if (channelIndex === -1) {
      const gains = this._getNode('gain');

      this.getOutputChannels().forEach((c, outputIndex) => {
        gains.forEach((gain) => {
          gain.disconnect(merger, 0, outputIndex);
        });
      });
    } else {
      const gain = this._getNode('gain', channelIndex);

      this.getOutputChannels().forEach((c, outputIndex) => {
        gain.disconnect(merger, 0, outputIndex);
      });
    }
  }

  mute(channel) {
    const channelIndex = this._getInputChannelIndex(channel);
    const splitter = this._getNode('splitter');

    // Already muted
    if (this._muted) {
      return;
    }

    this._muted = true;

    if (channelIndex === -1) {
      const gains = this._getNode('gain');

      gains.forEach((gain, index) => {
        splitter.disconnect(gain, index);
      });
    } else {
      const gain = this._getNode('gain', channelIndex);

      splitter.disconnect(gain, channelIndex);
    }
  }

  unmute(channel) {
    const channelIndex = this._getInputChannelIndex(channel);
    const splitter = this._getNode('splitter');

    // Already unmuted
    if (!this._muted) {
      return;
    }

    this._muted = false;

    if (channelIndex === -1) {
      const gains = this._getNode('gain');

      gains.forEach((gain, index) => {
        splitter.connect(gain, index);
      });
    } else {
      const gain = this._getNode('gain', channelIndex);

      splitter.connect(gain, channelIndex);
    }
  }
}

export default AudioGraph;
