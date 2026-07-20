import Partners from '../models/Partners.js';

class TrustedOrigin {
    constructor() {
        this.origin = new Set();
    }

    add(origin) {
        this.origin.add(origin);
    }

    has(origin) {
        return this.origin.has(origin);
    }

    get() {
        return Array.from(this.origin);
    }

    async load() {

    }
}

export const trustedOrigin = new TrustedOrigin();