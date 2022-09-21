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
    static load(client: Eden): Promise<unknown> {
        return new Promise(async (resolve: Function, reject: Function): Promise<unknown> => {
            try {

                // Set the new commands collection.
                client._commands = new Collection();

                // Load the commands directory.
                await Handler.read(client, './lib/commands');
                return resolve();
            } catch (error) {

                // Catch errors.
                return reject(error);
            }
        })
    }

    /**
     * Read a directory and load the commands.
     * 
     * @param {string} path - The path to the directory.
     * @returns {void}
     */
    private static async read(client: Eden, path: string): Promise<void> {

        // Read the directory and remove typings.
        const filtered: string[] = readdirSync(path).filter((file: string) => !file.endsWith('.d.ts'));

        // Get all files in the directory.
        const files: string[] = filtered.filter((file: string) => file.endsWith('.js'));

        // Get all directories in the directory.
        const folders: string[] = filtered.filter((file: string) => !files.includes(file));

        // Load all files in the directory.
        for (const file of files) await Handler.build(client, path, file);

        // Load all directories in the directory.
        for (const folder of folders) Handler.read(client, `${path}/${folder}`);
    }

    /**
     * Build a command and load it into cache.
     * 
     * @param {string} path - The path to the command.
     * @param {string} file - The file name of the command.
     * @returns {void}
     */
    private static async build(client: Eden, path: string, file: string): Promise<void> {

        // Import file.
        const command = await import(`../../${path}/${file}`);

        // Set the command in cache.
        client._commands.set(file.split('.')[0], new command.default({

            // Generate the command title using the file name.
            title: file.split('.')[0],

            // Get the command description from the command's class.
            about: command.default.about ?? '',

            // Generate the command group using the path.
            group: path.slice(2),

            // Calculate the command lines using fs.
            lines: readFileSync(`${path}/${file}`, 'utf8').split('\n').length,

            // Get the command ephemeral from the command's class.
            ephemeral: command.default.ephemeral ?? false,

            // Get the command options from the command's class.
            options: command.default.options ?? null,
        }))
    }
}
