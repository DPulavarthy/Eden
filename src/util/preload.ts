// Import dependencies.
import { config } from 'dotenv';
import { Eden } from '#manager';
import { ApplicationCommandOptionType, CommandInteraction as Interaction, ApplicationCommandOptionData } from 'discord.js';


declare global {

    // Declare a global client.
    var client: Eden;

    // Globally access interaction options types.
    var Options: typeof ApplicationCommandOptionType;

    // Command file interface.
    interface Meta {
        client: Eden;
        title: string;
        about: string;
        group: string;
        lines: number;
        ephemeral: boolean;
        options: ApplicationCommandOptionData[];
        run(interaction: Interaction, resolve: Function, reject: Function): Promise<void>;
    }

    interface Array<T> {

        // Check if 'this' is an array AND has at least one element.
        exists: () => boolean;

        // Get a random element from 'this' array.
        random: () => T;
    }

    interface Object {

        // Merge multiple objects into 'this'.
        mergify: (...subs: object[]) => object;
    }

    interface String {

        // Compare 'this' to another string, case insensitive.
        is: (query: string) => boolean;

        // Convert 'this' to camel case.
        camelify: () => string;

        // Parse 'this' into an object.
        parse: () => object;
    }
}

export default class Preload {
    public constructor() {

        // Catch all errors from the process and handle properly.
        process.on('uncaughtException', (error: Error | ReferenceError) => {
            console.error(error.stack);
            process.exit(1);
        });

        /**
         * Check if 'this' is an array AND has at least one element.
         * 
         * @return boolean
         * 
         * @example
         * [].exists(): false;
         * [1].exists(): true;
         */
        Array.prototype.exists = function (): boolean {
            return Array.isArray(this) && this?.some((e: unknown) => e);
        };

        /**
         * Get a random element from 'this' array.
         * 
         * @return T
         * 
         * @example
         * [1, 2, 3].random(): 1;
         */
        Array.prototype.random = function (): unknown {
            return this[Math.floor(Math.random() * this.length)];
        };

        /**
         * Merge multiple objects into 'this'.
         * 
         * @param subs - The objects to merge into 'this'.
         * @return object
         * 
         * @example
         * { a: 1 }.mergify({ b: 2 }): { a: 1, b: 2 };
         * {}.mergify({ a: 1 }): { a: 1 };
         */
        Object.prototype.mergify = function (...subs: object[]): object {
            subs.map((o: object) => Object.keys(o).map((k: string) => (this as { [key: string]: string })[k] = (o as { [key: string]: string })[k]));
            return this;
        };

        /**
         * Compare 'this' to another string, case insensitive.
         * 
         * @return boolean
         * 
         * @example
         * 'hello'.is('hello'): true;
         * 'hello'.is('HELLO'): true;
         * 'hello'.is('world'): false;
         */
        String.prototype.is = function (query: string): boolean {
            return this.localeCompare(query, undefined, { sensitivity: 'accent' }) === 0;
        };

        /**
         * Convert 'this' to camel case.
         * 
         * @return string
         * 
         * @example
         * 'hello world'.camelify(): 'helloWorld';
         * 'hello_world'.camelify(): 'helloWorld';
         */
        String.prototype.camelify = function (): string {
            return this.replace(/(?:^\w|[A-Z]|\b\w)/g, (word: string, index: number) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
        }

        /**
         * Parse 'this' into an object.
         * 
         * @return object
         * 
         * @example
         * '-hello world'.parse(): { hello: 'world' };
         * '-ts --query 17.3'.parse(): { ts: 'true', query: 17.3 };
         */
        String.prototype.parse = function (): object {
            const args: { [key: string]: string | boolean | number } = {};
            let split: RegExpMatchArray | null = `${this} -`.match(/(-{1,})(.*?)(?=\s)(.*?)(?=\s-)/g);
            split?.map((p: string) => {
                const key: string = p.split(' ').shift()?.replace(/^-{1,}/g, '') || '';
                let value: string | boolean | number = p.split(' ').slice(1).join(' ').trim() || true;
                if (!isNaN(parseFloat(value as string))) value = parseFloat(value as string);
                args[key] = value;
            })
            return args;
        };

        // Delcare interaction options globally.
        global.Options = ApplicationCommandOptionType;
    }

    /**
     * Check if required environment variables are loaded.
     * 
     * @return void  
     * 
     * @example
     * new Preload().load();
     */
    public load(): void {

        // Throw an error if the environment variables are not loaded.
        if (config()?.error) throw new ReferenceError('Failed to load .env properties.')

        // Throw an error if the wanted environment variables are not loaded.
        if (this.properties.exists()) throw new ReferenceError(`Failed to find following .env properties: ${this.properties.join(', ')}`)
    }


    /**
     * Check for the wanted environment variables.
     * 
     * @return string[]
     */
    private get properties(): string[] {
        const missing: string[] = []
        for (let id of ['TOKEN']) if (!process.env[id]) missing.push(id)
        return missing
    }
}
