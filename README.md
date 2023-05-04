## audio-context-router

### Features
- Easy playback of remote and local `MediaStream` objects
- Designed to allow for multiple tracks per user-group
- Simple channel-specific gain controls

### Getting Started
> Note: This hasn't been published yet

```js
import Audio from 'audio-context-router';
```

Setting the configuration. In most cases this doesn't need to be called because Chromium only supports stereo (2-channel) inputs and outputs.
```js
Audio.setConfiguration({
  input: {
    channels: 2
  },
  output: {
    channels: 2
  }
});
```

Starting audio playback:

```js
const audio = Audio.addInstance('james', 'guitar');
const stream = new MediaStream();

// Set stream via any source
audio.setStream(stream);

// Playback audio
audio.play();
```

![Simple Playback](./diagrams/graph-1.png)


Stopping audio playback:
```js
const audio = Audio.getInstance('james', 'guitar');

// Disconnect gains from merger to stop audio
audio.stop();
```

![Simple Stop Playback](./diagrams/graph-5.png)


Disconnecting audio graph instance:

```js
const audio = Audio.getInstance('james', 'guitar');

// Disconnect and clear audio graph instance
audio.disconnect();
```


Modifying audio gain (volume):

```js
const audio = Audio.getInstance('james', 'guitar');

// Set gain of all channels to 50%
audio.setGain(0.5);

// Set gain of right channel ([0, 1] => [L, R])
audio.setGain(0.5, 1);
```

![Audio gain diagram](./diagrams/graph-2.png)


Muting audio by channel:

```js
const audio = Audio.getInstance('james', 'guitar');

// Mute R channel
audio.mute(1);

// Later... Unmute R channel
audio.unmute(1);
```

Getting an `AudioNode`. By default, all graphs contain `source`, `splitter`, `merger`, `[gain]`:

```js
const graph = Audio.getInstance('james', 'guitar');

const audioNode = graph.getNode('splitter');
```


Adding custom `AudioNode` into the graph:

```js
const graph = Audio.getInstance('james', 'guitar');
const context = Audio.getContext();

const source = graph.getNode('source');
const analyser = context.createAnalyser();

// ... draw stuff using analyser data

source.connect(analyser);
```

