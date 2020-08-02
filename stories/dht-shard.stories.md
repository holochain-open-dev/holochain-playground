```js script
import '../dist/elements/holochain-playground-dht-shard.js'; 

export default {
  title: 'DHT Shard', 
  parameters: { component: 'holochain-playground-dht-shard' }, 
}; 

``` 
# Demo Web Component Card

A component meant to display small information with additional data on the back.
// [...] use markdown to format your text
// the following demo is inline

```js story
export const Simple = () => html `
  <holochain-playground-container>
    <holochain-playground-dht-shard>Hello World</holochain-playground-dht-shard> 
  </holochain-playground-container>` ;
```

## API

The api table will show the data of "demo-wc-card" in your `custom-elements.json` .

<sb-props of="holochain-playground-dht-shard"></sb-props>
