// Import dependencies.
import { User } from 'discord.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rename as moveFileSync, unlinkSync } from 'fs';
import { request } from 'https';
import { Transform as Stream } from 'stream';


export default class Cache {

    // A cache item interface.
    private static CacheItem: {
        key: string;
        value: string;
        user: string;
        accessed: number;
    }

    // Live storage interface.
    private static storage: {
        imgs: typeof Cache.CacheItem[];
        tags: typeof Cache.CacheItem[];
    }

    // Deleted storage interface.
    private static deleted: {
        imgs: typeof Cache.CacheItem[];
        tags: typeof Cache.CacheItem[];
    }

    /**
     * Load the cache manager.
     * 
     * @returns {void}
     */
    public static load(): void {

        // Create storage objects.
        this.mergify({ storage: {}, deleted: {} });

        // Create storage directories.
        ['./cache/deleted/images', './cache/storage/images'].map((path: string) => !existsSync(path) ? mkdirSync(path, { recursive: true }) : void 0);

        // Load storage files.
        Cache.storage.imgs = Cache.read('./cache/storage/meta.json') as typeof Cache.CacheItem[];
        Cache.storage.tags = Cache.read('./cache/storage/tags.json') as typeof Cache.CacheItem[];
        Cache.deleted.imgs = Cache.read('./cache/deleted/meta.json') as typeof Cache.CacheItem[];
        Cache.deleted.tags = Cache.read('./cache/deleted/tags.json') as typeof Cache.CacheItem[];
    }

    // Cache image manager.
    public static images = {

        /**
         * Create a new image cache item.
         * 
         * @param {string} key The image defined key.
         * @param {string} value The URL of the image.
         * @param {User} user The user who requested the image creation.
         * @returns {Promise<unknown>} A promise that resolves when the image is created.
         */
        create: (key: string, value: string, user: User): Promise<unknown> => new Promise(async (resolve, reject) => {
            try {

                // Check if image already exists.
                if (Cache.storage.imgs.find((item: typeof Cache.CacheItem) => item.key === key)) return reject('Image already exists');

                // Generate an image ID.
                const id = Cache.random();

                // Push and store in cache.
                Cache.storage.imgs.push({ key, value: id, user: user.id, accessed: Date.now(), } as never);
                Cache.download(value, `./cache/storage/images/${id}.png`);
                Cache.update(resolve);
            } catch (error) { reject(error); }
        }),


        /**
         * Update an image cache item.
         * 
         * @param {string} key The image defined key.
         * @param {string} newKey A new image defined key.
         * @param {string} value A new URL of the image.
         * @param {User} user The user who requested the image update.
         * @returns {Promise<unknown>} A promise that resolves when the image is updated.
         */
        update: (oldKey: string, newKey: string | null, value: string, user: User): Promise<unknown> => new Promise(async (resolve, reject) => {
            try {
                const set: object | undefined = Cache.storage.imgs.find((set: { key: string }) => set.key === oldKey);
                const dupe: object | undefined = Cache.storage.imgs.find((set: { key: string }) => set.key === newKey);

                // Check if image exists under 'newKey'.
                if (dupe) reject('Image cannot be renamed as the new name is already in use.');

                // Check if image exists under 'oldKey'.
                else if (set) {

                    // Merge new values.
                    (set as object).mergify({ key: newKey ?? oldKey, user: user.id, accessed: Date.now() });

                    // Download new image.
                    Cache.download(value, `./cache/storage/images/${(set as { value: string }).value}.png`);

                    // Push and store in cache.
                    Cache.storage.imgs = [...(Cache.storage.imgs.filter((set: { key: string }) => set.key !== newKey ?? oldKey) || {}), set as never];
                    Cache.update(resolve);
                } else reject('No image found with that key.');
            } catch (error) { reject(error); };
        }),

        /**
         * Delete an image cache item.
         * 
         * @param {string} key The image defined key.
         * @param {User} user The user who requested the image update.
         * @returns {Promise<unknown>} A promise that resolves when the image is deleted.
         */
        delete: (key: string, user: User): Promise<unknown> => new Promise(async (resolve, reject) => {
            try {
                const set: object | undefined = Cache.storage.imgs.find((set: { key: string }) => set.key === key);

                // Check if image exists.
                if (set) {

                    // Move image to deleted directory instead of deleting forever.
                    Cache.deleted.imgs.push((set as object).mergify({ user: user.id, accessed: Date.now() }) as never);
                    moveFileSync(`./cache/storage/images/${(set as { value: string }).value}.png`, `./cache/deleted/images/${(set as { value: string }).value}.png`, () => null);

                    // Push and store in cache.
                    Cache.storage.imgs = Cache.storage.imgs.filter((set: { key: string }) => set.key !== key);
                    Cache.update(resolve);
                } else reject('No tag found with that key.');
            } catch (error) { reject(error); };
        }),

        /**
         * Fetch an image cache item.
         * 
         * @param {string} key The image defined key.
         * @returns {object | undefined} An image cache item.
         */
        fetch: (key: string | null): object | undefined => {
            // Get the image from cache.
            const set = key ? Cache.storage.imgs.find((set: { key: string }) => set.key === key) as object : void 0;

            // Modify the value so that it is a path to the image.
            return { ...set, value: `./cache/storage/images/${(set as { value: string }).value}.png` };
        },

        /**
         * Purge ALL deleted images from the cache.
         * 
         * @returns {typeof Cache.CacheItem[] as object[]} An array of deleted image cache items.
         */
        purge: (): typeof Cache.CacheItem[] => {

            // Make a local copy of the images.
            const copy = Cache.deleted.imgs;

            // Delete all images.
            Cache.deleted.imgs.map((set: { value: string }) => unlinkSync(`./cache/deleted/images/${set.value}.png`));

            // Reset and store in cache.
            Cache.deleted.imgs = [];
            Cache.update();

            // Return a copy of the data to show the user.
            return copy;
        },

        /**
         * Get all images from the cache.
         * 
         * @returns {typeof Cache.CacheItem[] as object[]} An array of image cache items.
         */
        list: (): typeof Cache.CacheItem[] => Cache.storage.imgs,
    }

    // Tags cache manager.
    public static tags = {

        /**
         * Create a new tag cache item.
         * 
         * @param {string} key The tag defined key.
         * @param {string} value The content of the text.
         * @param {User} user The user who requested the tag creation.
         * @returns {Promise<unknown>} A promise that resolves when the tag is created.
         */
        create: (key: string, value: string, user: User): Promise<unknown> => new Promise(async (resolve, reject) => {
            try {

                // Check if tag already exists.
                if (Cache.storage.tags.find((set: { key: string }) => set.key === key)) return reject('Tag already exists');

                // Push and store in cache.
                Cache.storage.tags.push({ key, value, user: user.id, accessed: Date.now() } as never);
                Cache.update(resolve);
            } catch (error) { reject(error); };
        }),

        /**
         * Update an tag cache item.
         * 
         * @param {string} key The tag defined key.
         * @param {string} newKey A new tag defined key.
         * @param {string} value A new text of the tag.
         * @param {User} user The user who requested the tag update.
         * @returns {Promise<unknown>} A promise that resolves when the tag is updated.
         */
        update: (oldKey: string, newKey: string | null, newValue: string, user: User): Promise<unknown> => new Promise(async (resolve, reject) => {
            try {
                const set: object | undefined = Cache.storage.tags.find((set: { key: string }) => set.key === oldKey);
                const dupe: object | undefined = Cache.storage.tags.find((set: { key: string }) => set.key === newKey);

                // Check if tag exists under 'newKey'.
                if (dupe) reject('Tag cannot be renamed as the new name is already in use.');

                // Check if tag exists under 'oldKey'.
                else if (set) {

                    // Merge new values.
                    (set as object).mergify({ key: newKey ?? oldKey, value: newValue, user: user.id, accessed: Date.now() });

                    // Push and store in cache.
                    Cache.storage.tags = [...Cache.storage.tags.filter((set: { key: string }) => set.key !== newKey ?? oldKey), set as never];
                    Cache.update(resolve);
                } else reject('No tag found with that key.');
            } catch (error) { reject(error); };
        }),

        /**
         * Delete an tag cache item.
         * 
         * @param {string} key The tag defined key.
         * @param {User} user The user who requested the tag update.
         * @returns {Promise<unknown>} A promise that resolves when the tag is deleted.
         */
        delete: (key: string, user: User): Promise<unknown> => new Promise(async (resolve, reject) => {
            try {
                const set: object | undefined = Cache.storage.tags.find((set: { key: string }) => set.key === key);

                // Check if image exists.
                if (set) {

                    // Move image to deleted directory instead of deleting forever.
                    Cache.deleted.tags.push((set as object).mergify({ user: user.id, accessed: Date.now() }) as never);
                    
                    // Push and store in cache.
                    Cache.storage.tags = Cache.storage.tags.filter((set: { key: string }) => set.key !== key);
                    Cache.update(resolve);
                } else reject('No tag found with that key.');
            } catch (error) { reject(error); };
        }),

        /**
         * Fetch an tag cache item.
         * 
         * @param {string} key The tag defined key.
         * @returns {object | undefined} An tag cache item.
         */
        fetch: (key: string | null): object | undefined => key ? Cache.storage.tags.find((set: { key: string }) => set.key === key) as object : void 0,

        /**
         * Purge ALL deleted tags from the cache.
         * 
         * @returns {typeof Cache.CacheItem[] as object[]} An array of deleted tag cache items.
         */
        purge: (): typeof Cache.CacheItem[] => {

            // Make a local copy of the tags.
            const copy = Cache.deleted.tags;

            // Delete all tags.
            Cache.deleted.tags = []

            // Reset and store in cache.
            Cache.update();

            // Return a copy of the data to show the user.
            return copy;
        },

        /**
         * Get all tags from the cache.
         * 
         * @returns {typeof Cache.CacheItem[] as object[]} An array of tag cache items.
         */
        list: (): typeof Cache.CacheItem[] => Cache.storage.tags,
    }

    /** 
     * Get a JSON file and parse it. (With error handling).
     * 
     * @param {string} path The path to the JSON file.
     * @returns {object[]} The parsed JSON file.
     */
    private static read(path: string): object[] {

        // Check if file exists.
        const exists: boolean = existsSync(path);

        // Save and return empty array if file is not found.
        if (!exists) {
            Cache.write(path, []);
            return [];
        }

        // Read and parse file.
        const data: string = readFileSync(path, 'utf8');
        try {
            return JSON.parse(data);
        } catch {

            // If parse failed, return empty array.
            return [];
        }
    }

    /**
     * Write an object to a JSON file.
     * 
     * @param {string} path The path to the JSON file.
     * @param {object[]} data The data to write to the JSON file.
     * @returns {void}
     */
    private static write(path: string, data: object[]): void {
        writeFileSync(path, JSON.stringify(data, null, 4), 'utf8');
    }

    /**
     * Generate a random ID.
     * 
     * @param {number} length The number of sections the ID should have.
     * @param {number} length The number of characters per section.
     * @param {string} join The character to join the sections.
     * @returns {string} The generated ID.
     */
    private static random(sections?: number, phrase?: number, join?: string): string {
        // A list of characters to use in the ID [A-z0-9].
        const list = [...[...Array(26)].map((_, i) => String.fromCharCode(i + 65)), ...[...Array(26)].map((_, i) => String.fromCharCode(i + 65).toLowerCase()), ...[...Array(10).keys()]];

        // A function to generate a random character.
        const random = () => list[Math.floor(Math.random() * list.length)];

        // Generate the ID.
        return [...Array(sections || 5)].map(_ => [...Array(phrase || 5)].map(random).join('')).join(join || '-');
    }

    /**
     * Download an image.
     * 
     * @param {string} url The URL of the image.
     * @param {string} path The path to save the image to.
     * @returns {void}
     */
    private static download(url: string, path: string): void {
        // Request the image.
        request(url, (img) => {
            const data = new Stream();

            // Stream the image data to a variable.
            img.on('data', chunk => data.push(chunk));

            // Write image data to a file.
            img.on('end', () => writeFileSync(path, data.read()));
        }).end();
    }

    /**
     * Update the local cache files.
     * 
     * @param {Function} callback The function to call after the cache has been updated.
     * @returns {void}
     */
    private static update(resolve?: Function): void {
        Cache.write('./cache/storage/meta.json', Cache.storage.imgs);
        Cache.write('./cache/storage/tags.json', Cache.storage.tags);
        Cache.write('./cache/deleted/meta.json', Cache.deleted.imgs);
        Cache.write('./cache/deleted/tags.json', Cache.deleted.tags);
        if (resolve) resolve(false);
    }
}
