class ActualSet<T> implements Set<T> {
	map = new Map<string, T>();
	
	constructor(public hasher:(T)=>string) {}
	
	get size() {return this.map.size; }

    add(item:T) {
        this.map.set(this.hasher(item), item);
		return this;
    }
	
	clear() {
		this.map.clear();
		return this;
	}
	
	delete(item:T) {
		return this.map.delete(this.hasher(item));
	}
	
	entries():IterableIterator<[T,T]> {
		let realIt = this.map.values();
		let it:Iterator<[T,T]> = {
			next: realIt.next.bind(realIt),
			return: realIt.return.bind(realIt),
			throw: realIt.throw.bind(realIt)
		};
		it[Symbol.iterator] = it;
		return <IterableIterator<[T,T]>>it;
	}

    [Symbol.iterator]() {
        return this.map.values();
    }
	
	has(item:T) {
		return this.map.has(this.hasher(item));
	}
	forEach(callbackfn: (value: T, index: T, set: Set<T>) => void, thisArg: any = this): void {
		for(let v of this) callbackfn.call(thisArg, v, v);
	}
	keys() {
		return this.map.values();
	}
	values() {
		return this.map.values();
	}
	get [Symbol.toStringTag]() {
		return this.map[Symbol.toStringTag];
	}
}