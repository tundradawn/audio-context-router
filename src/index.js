import get from 'lodash/get';
import merge from 'lodash/merge';

import AudioGraph from './graph';
import { mapChannels } from './utils';

// Note: Currently Chrome only supports stereo audio devices
const DEFAULT_CONFIG = {
  input: {
    channels: 2
  },
  output: {
    channels: 2
  }
};

class AudioRouter {
  constructor() {
    this._config = DEFAULT_CONFIG;
    this._audioContext = new AudioContext();
    this._graphs = {};

    /**
     * graphs = {
     *   [client 1]: [
     *    [talkback]: <AudioGraph>,
     *    [juno]: <AudioGraph>
     *   ],
     *   [client 2]: [
     *    [talkback]: <AudioGraph>,
     *    [organ]: <AudioGraph>
     *   ],
     * }
     */
  }

  setConfiguration(config = {}) {
    this._config = merge({}, DEFAULT_CONFIG, config);
  }

  addInstance(groupId, trackId, useAudioElement) {
    this._graphs[groupId] = this._graphs[groupId] || [];
    this._graphs[groupId][trackId] = new AudioGraph(trackId, this._audioContext, this._config, useAudioElement);

    return get(this._graphs, [groupId, trackId]);
  }

  getInstanceGroup(groupId) {
    return get(this._graphs, [groupId]);
  }

  getInstance(groupId, trackId) {
    return get(this._graphs, [groupId, trackId]);
  }

  getContext() {
    return this._audioContext;
  }

  getInputChannels() {

    // Map channels from [0, 1] to [1, 2]
    return mapChannels(this._config.input.channels);
  }

  /**
   * Obtain a single channel of data from a multi-channel stream.
   *
   * @param  {MediaStream} stream
   * @param  {number} channel
   * @return {MediaStream}
   */
  getChannelStream(stream, channel) {
    const channelIndex = this.getInputChannels().indexOf(channel);
    const source = this._audioContext.createMediaStreamSource(stream);
    const destination = this._audioContext.createMediaStreamDestination();
    const splitter = this._audioContext.createChannelSplitter(this._config.input.channels);

    source.connect(splitter);

    splitter.connect(destination, channelIndex);

    return destination.stream;
  }
}

export default new AudioRouter();
