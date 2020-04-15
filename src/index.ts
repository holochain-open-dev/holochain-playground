import { HolochainPlayground } from "./elements/holochain-playground";
import { ConductorDetail } from "./elements/conductor-detail";
import { SourceChain } from "./elements/source-chain";
import { DHTShard } from "./elements/dht-shard";
import { CreateEntries } from "./elements/create-entries";
import { DHTGraph } from "./elements/dht-graph";
import { DHTStats } from "./elements/dht-stats";
import { BlackboardContainer } from "./blackboard/blackboard-container";
import { TechnicalMode } from "./elements/technical-mode";
import { DesignerMode } from "./elements/designer-mode";
import { EntryGraph } from "./elements/entry-graph";
import { EntryDetail } from "./elements/entry-detail";

customElements.define("blackboard-container", BlackboardContainer);
customElements.define("holochain-playground", HolochainPlayground);
customElements.define("dht-graph", DHTGraph);
customElements.define("conductor-detail", ConductorDetail);
customElements.define("source-chain", SourceChain);
customElements.define("dht-shard", DHTShard);
customElements.define("create-entries", CreateEntries);
customElements.define("dht-stats", DHTStats);
customElements.define("technical-mode", TechnicalMode);
customElements.define("designer-mode", DesignerMode);
customElements.define("entry-graph", EntryGraph);
customElements.define("entry-detail", EntryDetail);