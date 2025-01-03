/**
 * Various attempts at making properly type-safe version of Handler, but so far unsuccessful.
 */

type NameTypeMap<T> = {
    [k in keyof HTMLElementEventMap as HTMLElementEventMap[k] extends T ? k : never]: HTMLElementEventMap[k] extends T ? k : never;
}

// type EventName<EventType> = keyof NameTypeMap<EventType>;
type EventName<EventType> = keyof {
    [k in keyof HTMLElementEventMap as HTMLElementEventMap[k] extends EventType ? k : never]: HTMLElementEventMap[k] extends EventType ? k : never;
};


// type EventHandler<EventType extends Event, ElementType extends EventTarget> = {
//     handler: (evt: EventType) => void,
//     source: (that: ElementType) => EventTarget,
//     requiresReady: boolean    
// }
// type EventMap<ElementType extends EventTarget> = {
//     [type in keyof HTMLElementEventMap]?: Extract<EventHandler<ElementType>, {event: type}>
// }


type t = ExpandRecursively<MappedEventListenerObject<EventTarget>["event_list"]>

// type EventHandler<ElementType extends EventTarget = EventTarget, K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap> = {
//     [P in K]: {
//         event: P,
//         handler: (ev: HTMLElementEventMap[P]) => void,
//         source: (that: ElementType) => EventTarget,
//         requiresReady: boolean            
//     }
// }[K];


type EventHandler<ElementType extends EventTarget = EventTarget, K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap> = {
    [P in K]: {
        event: P,
        handler: (ev: HTMLElementEventMap[P]) => void,
        source: (that: ElementType) => EventTarget,
        requiresReady: boolean            
    }
}[K];


type EventHandler2<K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap> = {
    [P in K]: {
        event: P,
        handler: (ev: HTMLElementEventMap[P]) => void,
        source: (that: EventTarget) => EventTarget,
        requiresReady: boolean            
    }
}[K];

const e1 = {event: "mouseover", handler: (ev: MouseEvent) => {}, source: (that) => that, requiresReady: false} satisfies EventHandler2;


type RecordMap = { n: number, s: string, b: boolean };
type UnionRecord<K extends keyof RecordMap = keyof RecordMap> = { [P in K]: {
    kind: P,
    v: RecordMap[P],
    f: (v: RecordMap[P]) => void
}}[K];

function processRecord<K extends keyof RecordMap>(rec: UnionRecord<K>) {
    rec.f(rec.v);  // Ok
}
function makeRecord<K extends keyof RecordMap>(kind: K, v: RecordMap[K], f: (v: RecordMap[K]) => void): UnionRecord<K> {
    return {kind, v, f};
}
function addRecordToArray<K extends keyof RecordMap>(record: UnionRecord<K>): UnionRecord[] {
    return [record];
}
const r3 = { kind: 'n', v: 42, f: v => v.toExponential() } satisfies UnionRecord;
function makeRecordByKey<
    const This extends MappedEventListenerObject<ElementType>,
    ElementType extends EventTarget,
    EventName extends keyof HTMLElementEventMap
>(
    event: EventName,
    eventSource: (that: ElementType) => EventTarget = (that: ElementType) => that,
    requiresReady = true
) {
    return function(originalFunction: (ev: HTMLElementEventMap[EventName]) => void, context: ClassMethodDecoratorContext<This, (this: This, ev: HTMLElementEventMap[EventName]) => void>) {
        var list: EventHandler<ElementType>[] = [];
        context.addInitializer(
            function() {
                const handler = {
                    event: event,
                    handler: originalFunction,
                    source: eventSource,
                    requiresReady
                } satisfies EventHandler<ElementType>;
                // this.event_map[type] = handler;
                this.event_map[handler.event] = handler;
                this.event_list.push(handler);
                list = [...list, handler];
            }
        );
    }
}

/// Version using Stage 3 Decorator syntax, which isn't easily supported via vite-react-swc yet

type EventMap<ElementType extends EventTarget> = {
    [Event in keyof HTMLElementEventMap]?: EventHandler<ElementType, Event>
}
export abstract class MappedEventListenerObject<ElementType extends EventTarget> implements EventListenerObject {
    event_map: EventMap<ElementType> = {};
    constructor(protected element: ElementType){}
    public handleEvent(e: Event) : void {
        const map = this.event_map[e.type as keyof EventMap<ElementType>];
        if(map !== undefined) {
            if(!(map.handler.call instanceof Function)) {
                console.error("Failed to handle", e, map.handler, "is not a function");
            }
            (map.handler as any).call(this, e as any as keyof HTMLElementEventMap);
        }
    }
    public attach() {
        for(const [event, eventMap] of Object.entries(this.event_map)) {
            eventMap.source(this.element).addEventListener(event, this);
        }
    }
    public detach() {
        for(const [event, eventMap] of Object.entries(this.event_map)) {
            eventMap.source(this.element).removeEventListener(event, this);
        }        
        
    }    
}




function GenericHandler<
    const This extends MappedEventListenerObject<ElementType>,
    ElementType extends EventTarget,
    const EventName extends keyof HTMLElementEventMap
>(
    type: EventName,
    eventSource: (that: ElementType) => EventTarget = (that: ElementType) => that,
    requiresReady = true
) {
    
    return function(originalFunction: (ev: HTMLElementEventMap[EventName]) => void, context: ClassMethodDecoratorContext<This, (this: This, ev: HTMLElementEventMap[EventName]) => void>) {
        context.addInitializer(
            function() {
                const handler = {
                    event: type,
                    handler: originalFunction,
                    source: eventSource,
                    requiresReady
                } satisfies EventHandler<ElementType, EventName>;
                this.event_map[type] = handler as EventMap<ElementType>[EventName];
            }
        );
    }
}