// Declare a Command interface that extends the Meta interface.
export default interface Command extends Meta { }

// A command base class.
export default class Command implements Meta {

    // Fallback command description.
    public static get about(): string {
        return 'No description provided.';
    }

    // Merge the command meta data.
    public constructor(meta: Meta) {
        this.mergify(meta);
    }

    // Fallback command run handler.
    public async run(interaction: Interaction, resolve: Function, reject: Function): Promise<unknown> {
        return reject('This was not supposed to happen!');
    }
}
