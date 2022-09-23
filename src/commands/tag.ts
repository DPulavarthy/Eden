import { Cache } from '#manager'

export default class Tag extends Command {

    /**
     * Get the command description.
     * 
     * @returns {string}
     */
    public static get about(): string {
        return 'Text tag manager.';
    }

    /**
     * Get the command privacy.
     * 
     * @returns {boolean}
     */
    public static get ephemeral(): boolean {
        return true;
    }

    /**
     * Get the command options.
     * 
     * @returns {ChatInputApplicationCommandData[]}
     */
    public static get options(): object[] {
        return [
            {
                name: 'create', description: 'Add a new text tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the text tag.', type: Options.String, required: true },
                    { name: 'content', description: 'The content of the text tag.', type: Options.String, required: true },
                    { name: 'url', description: 'The url of the text tag.', type: Options.String, required: false },
                ]
            },
            {
                name: 'delete', description: 'Delete a text tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the text tag.', type: Options.String, required: true },
                    { name: 'verify', description: 'Verify the deletion.', type: Options.Boolean, required: true },
                ]
            },
            {
                name: 'fetch', description: 'Get a text tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the text tag.', type: Options.String, required: true },
                ]
            },
            {
                name: 'update', description: 'Update a text tag.', type: Options.Subcommand, options: [
                    { name: 'name', description: 'The current name of the text tag.', type: Options.String, required: true },
                    { name: 'content', description: 'The new content of the text tag.', type: Options.String, required: false },
                    { name: 'newname', description: 'The new name of the text tag.', type: Options.String, required: false },
                    { name: 'url', description: 'The new url of the text tag.', type: Options.String, required: false },
                ]
            },
            {
                name: 'list', description: 'List all text tags.', type: Options.Subcommand, options: [
                    { name: 'filterby', description: 'A text to filter results by.', type: Options.String, required: false },
                ]
            },
            {
                name: 'purge', description: 'Delete all text tags in the trash.', type: Options.Subcommand,
                options: [
                    { name: 'verify', description: 'Verify the deletion.', type: Options.Boolean, required: true },
                ]
            },
        ];
    }

    /**
     * Execute the command logic.
     * 
     * @param {Interaction} interaction
     * @returns {Promise<void>}
     */
    public async run(interaction: Interaction, resolve: Function, reject: Function): Promise<void> {

        // Get the subcommand.
        const command = interaction.options.getSubcommand(true);

        // Store switch case values here.
        let result;
        let message;
        let fetch = {
            tag: '',
            accessed: 0,
            url: '',
        };

        switch (command) {

            // Create a new tag.
            case 'create': {

                // Get the action parameters.
                const name = interaction.options.getString('name', true);
                const content = interaction.options.getString('content', true);
                const url = interaction.options.getString('url', false);

                // Run the action.
                result = await Cache.tags.create(name?.toLowerCase(), content, url ?? '', interaction.user).catch(error => error);

                // Post the result.
                message = result as string ?? 'Tag successfully created. Your action has been logged.';
                break;
            }

            // Delete a tag.
            case 'delete': {

                // Get the action parameters.
                const verify = interaction.options.getBoolean('verify', true);

                // Make sure the action is verified.
                if (verify) {

                    // Run the action.
                    result = await Cache.tags.delete(interaction.options.getString('name', true)?.toLowerCase(), interaction.user).catch(error => error);

                    // Post the result.
                    message = result as string ?? 'Tag successfully deleted. Your action has been logged.';
                } else {
                    message = 'Deletion cancelled.';
                }
                break;
            }

            // Fetch a tag.
            case 'fetch': {

                // Run the action.
                const tag: object | undefined = await Cache.tags.fetch(interaction.options.getString('name')?.toLowerCase() ?? null);

                // Post the result.
                message = tag ? `${(tag as { key: string }).key}: ${(tag as { value: string }).value} [Last accessed ${(Date.now() - (tag as { accessed: number }).accessed).timify(true)}]` : 'Tag does not exist.';
                fetch.accessed = tag ? (tag as { accessed: number }).accessed : 0;
                fetch.tag = tag ? client.users.cache.get((tag as { user: string }).user)?.tag ?? '' : '';
                fetch.url = tag ? (tag as { url: string }).url : '';
                break;
            }

            // Update a tag.
            case 'update': {

                // Get the action parameters.
                const name = interaction.options.getString('name', true).toLowerCase();
                const content = interaction.options.getString('content');
                const newname = interaction.options.getString('newname') ?? null;
                const url = interaction.options.getString('url');

                // Run the action.
                result = await Cache.tags.update(name, newname, content, url, interaction.user).catch(error => error);

                // Post the result.
                message = result as string ?? 'Tag successfully updated. Your action has been logged.';
                break;
            }

            // List all tags.
            case 'list': {

                // Get the action parameters.
                const filterby = interaction.options.getString('filterby') ?? null;

                // Run the action.
                const tags = Cache.tags.list(filterby?.toLowerCase());

                // Post the result.
                message = tags.exists() ? tags.map(set => `${set.key} [Last accessed ${(Date.now() - set.accessed).timify(true)} ago]`).join('\n') : 'No tags found.';
                break;
            }

            // Purge the trash.
            case 'purge': {

                // Get the action parameters.
                const verify = interaction.options.getBoolean('verify', true);

                // Make sure the action is verified.
                if (verify) {

                    // Run the action.
                    const data = Cache.tags.purge();

                    // Post the result.
                    message = data.exists() ? `Deleted ${data.length} tag(s). View them below:\n${data.map(set => `${set.key}: ${set.value} [Last accessed ${(Date.now() - set.accessed).timify(true)} ago]`).join('\n')}` : 'No tags found.';
                } else {
                    message = 'Purge cancelled.';
                }
                break;
            }
        }

        // Send the message.
        interaction.editReply({
            content: null, embeds: [{
                ...embed,
                title: command === 'fetch' ? fetch.url : undefined,
                url: command === 'fetch' ? fetch.url : undefined,
                description: (message || 'Action Completed!').codify(),
                timestamp: new Date(command === 'fetch' ? fetch.accessed : Date.now()).toISOString(),
                footer: {
                    text: command === 'fetch' ? `Last modified by ${fetch.tag}` : embed.footer.text,
                    icon_url: command === 'fetch' ? interaction.user.displayAvatarURL() : embed.footer.icon_url,
                }
            }]
        }).catch(error => reject(error));
        resolve();
    }
}
