import { Cache } from '#manager'
import { resolve as join } from 'path'

export default class Img extends Command {

    /**
     * Get the command description.
     * 
     * @returns {string}
     */
    public static get about(): string {
        return 'Image tag manager.';
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
                name: 'create', description: 'Add a new image tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the image tag.', type: Options.String, required: true },
                    { name: 'image', description: 'The image for the tag.', type: Options.Attachment, required: true },
                ]
            },
            {
                name: 'delete', description: 'Delete an image tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the image tag.', type: Options.String, required: true },
                    { name: 'verify', description: 'Verify the deletion.', type: Options.Boolean, required: true },
                ]
            },
            {
                name: 'fetch', description: 'Get an image tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the image tag.', type: Options.String, required: true },
                ]
            },
            {
                name: 'update', description: 'Update an image tag.', type: Options.Subcommand, options: [
                    { name: 'name', description: 'The current name of the image tag.', type: Options.String, required: true },
                    { name: 'image', description: 'The new image for the tag.', type: Options.Attachment, required: true },
                    { name: 'newname', description: 'The new name of the image tag.', type: Options.String, required: false },
                ]
            },
            { name: 'list', description: 'List all image tags.', type: Options.Subcommand, options: [] },
            {
                name: 'purge', description: 'Delete all image tags in the trash.', type: Options.Subcommand,
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
            attachment: {
                name: '',
                path: ''
            }
        }

        switch (command) {

            // Create a new image.
            case 'create': {

                // Get the action parameters.
                const name = interaction.options.getString('name', true);
                const image = interaction.options.getAttachment('image', true);

                // Run the action.
                result = await Cache.images.create(name, image.url, interaction.user).catch(error => error);

                // Post the result.
                message = result as string ?? 'Image successfully created. Your action has been logged.';
                break;
            }

            // Delete an image.
            case 'delete': {

                // Get the action parameters.
                const verify = interaction.options.getBoolean('verify', true);

                // Make sure the action is verified.
                if (verify) {

                    // Run the action.
                    result = await Cache.images.delete(interaction.options.getString('name', true), interaction.user).catch(error => error);

                    // Post the result.
                    message = result as string ?? 'Image successfully deleted. Your action has been logged.';
                } else {
                    message = 'Deletion cancelled.';
                }
                break;
            }

            // Fetch an image.
            case 'fetch': {

                // Run the action.
                const img: object | undefined = await Cache.images.fetch(interaction.options.getString('name'));

                // Post the result.
                message = img ? `${(img as { key: string }).key}.png [Last accessed ${(Date.now() - (img as { accessed: number }).accessed).timify(true)}]` : 'Tag does not exist.';
                fetch.accessed = img ? (img as { accessed: number }).accessed : 0;
                fetch.tag = img ? client.users.cache.get((img as { user: string }).user)?.tag ?? '' : '';
                fetch.attachment.path = join(__dirname, '../../', (img as { value: string }).value.slice(2));
                fetch.attachment.name = `${(img as { key: string }).key}.png`;
                break;
            }

            // Update an image.
            case 'update': {

                // Get the action parameters.
                const name = interaction.options.getString('name', true);
                const image = interaction.options.getAttachment('image', true);
                const newname = interaction.options.getString('newname') ?? null;

                // Run the action.
                result = await Cache.images.update(name, newname, image.url, interaction.user).catch(error => error);

                // Post the result.
                message = result as string ?? 'Image successfully updated. Your action has been logged.';
                break;
            }

            // List all images.
            case 'list': {

                // Run the action.
                const imgs = Cache.images.list();

                // Post the result.
                message = imgs.exists() ? imgs.map(set => `${set.key}.png [Last accessed ${(Date.now() - set.accessed).timify(true)} ago]`).join('\n') : 'No images found.';
                break;
            }

            // Purge the trash.
            case 'purge': {

                // Get the action parameters.
                const verify = interaction.options.getBoolean('verify', true);

                // Make sure the action is verified.
                if (verify) {

                    // Run the action.
                    const data = Cache.images.purge();

                    // Post the result.
                    message = data.exists() ? `Deleted ${data.length} image(s). View them below:\n${data.map(set => `${set.key}.png [Last accessed ${(Date.now() - set.accessed).timify(true)} ago]`).join('\n')}` : 'No tags found.';
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
                description: (message || 'Action Completed!').codify(),
                timestamp: new Date(command === 'fetch' ? fetch.accessed : Date.now()).toISOString(),
                image: command === 'fetch' ? { url: `attachment://${fetch.attachment.name}` } : undefined,
                footer: {
                    text: command === 'fetch' ? `Last modified by ${fetch.tag}` : embed.footer.text,
                    icon_url: command === 'fetch' ? interaction.user.displayAvatarURL() : embed.footer.icon_url,
                },
            }],
            files: command === 'fetch' ? [{
                attachment: fetch.attachment.path,
                name: fetch.attachment.name,
            }] : [],
        }).catch(error => reject(error));
        resolve();
    }
}
