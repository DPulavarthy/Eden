// Import dependencies.
import { Eden } from '#manager';
import { Collection } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';

export default class Handler {

    /**
     * Load commands into cache.
     * 
     * @param {Eden} client - The client object.
     * @returns {Promise<void>} 
     */
    static load(client: Eden) {
        return new Promise(async (resolve: Function, reject: Function) => {
            try {

                // Set the new commands collection.
                client._commands = new Collection();

                // Load the commands directory.
                await read('./lib/commands');
                resolve();
            } catch (error) {

                // Catch errors.
                reject(error);
            }

            /**
             * Read a directory and load the commands.
             * 
             * @param {string} path - The path to the directory.
             * @returns {void}
             */
            async function read(path: string) {

                // Read the directory and remove typings.
                const filtered: string[] = readdirSync(path).filter((file: string) => !file.endsWith('.d.ts'));

                // Get all files in the directory.
                const files: string[] = filtered.filter((file: string) => file.endsWith('.js'));

                // Get all directories in the directory.
                const folders: string[] = filtered.filter((file: string) => !files.includes(file));

                // Load all files in the directory.
                for (const file of files) await build(path, file);

                // Load all directories in the directory.
                for (const folder of folders) read(`${path}/${folder}`);
            }

            /**
             * Build a command and load it into cache.
             * 
             * @param {string} path - The path to the command.
             * @param {string} file - The file name of the command.
             * @returns {void}
             */
            async function build(path: string, file: string) {

                // Import file.
                const command = await import(`../../${path}/${file}`);

                // Set the command in cache.
                client._commands.set(file.split('.')[0], new command.default(client, {
                    title: file.split('.')[0],
                    about: command.default.about ?? '',
                    group: path.slice(2),
                    lines: readFileSync(`${path}/${file}`, 'utf8').split('\n').length,
                    ephemeral: command.default.ephemeral ?? false,
                    options: command.default.options ?? null,
                }));
            }
        })
    }
}
