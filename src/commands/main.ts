import fetch from "node-fetch";
import { createWriteStream } from "node:fs";

import { CocoaVersion, getElapsed } from "cocoa-discord-utils/meta";
import {
    CogSlashClass,
    FutureSlash,
    SlashCommand,
} from "cocoa-discord-utils/slash/class";
import {
    AutoBuilder,
    CocoaOption,
    Ephemeral,
    getEphemeral,
    getStatusFields,
} from "cocoa-discord-utils/template";

import { CommandInteraction } from "discord.js";

import { Version as MusicVersion } from "@leomotors/music-bot";

import { exec } from "../utils";

import { style } from "./style";

export class MainCog extends CogSlashClass {
    private timePinged = 0;

    constructor() {
        super("Main Cog", "Main Cog of this bot");
    }

    @SlashCommand(AutoBuilder("Pong!"))
    async ping(ctx: CommandInteraction) {
        await ctx.reply(
            `Pong! Respond took ${getElapsed(
                ctx.createdAt
            )} ms. Since start, I have been pinged ${++this.timePinged} times!`
        );
    }

    @SlashCommand(AutoBuilder("Get Bot's Status").addBooleanOption(Ephemeral()))
    async status(ctx: CommandInteraction) {
        const ephemeral = getEphemeral(ctx);

        const emb = style
            .use(ctx)
            .setTitle("C--'s Status")
            .setDescription(
                `[C--](https://github.com/Leomotors/cminusminus) Bot Version: ${process.env.npm_package_version}\n[Cocoa Discord Utils](https://github.com/Leomotors/cocoa-discord-utils) Version: ${CocoaVersion}\n[@leomotors/music-bot](https://github.com/Leomotors/music-bot) Version: ${MusicVersion}`
            )
            .addFields(await getStatusFields(ctx));

        await ctx.reply({ embeds: [emb.toJSON()], ephemeral });
    }

    @FutureSlash(async () => {
        const frameLists = (await exec("golden-frame list")).stdout
            .split("\n")
            .slice(1)
            .filter((l) => l.length)
            .map((e) => e.split(" ")[0]!.trim())
            .map((e) => ({ name: e, value: e }));

        return AutoBuilder("Create Golden Frame")
            .addStringOption((option) =>
                option
                    .setName("frame")
                    .setDescription("Frame Name")
                    .setRequired(true)
                    .addChoices(...frameLists)
            )
            .addUserOption(CocoaOption("who", "Who to put in the golden frame"))
            .addAttachmentOption(
                CocoaOption("img", "Image to put in the frame")
            );
    })
    async goldenframe(ctx: CommandInteraction) {
        const frame = ctx.options.getString("frame", true);

        const target_user = ctx.options.getUser("who");

        const target_img = ctx.options.getAttachment("img");

        if (!target_user && !target_img) {
            await ctx.reply("Either user or image must be given!");
            return;
        }

        await ctx.deferReply();

        let url: string | null;
        if (target_user) {
            url = target_user.avatarURL({ size: 4096 });
            if (!url) {
                await ctx.followUp(
                    "Cannot Golden Frame: Target user has no profile picture!"
                );
                return;
            }
        } else {
            url = target_img!.attachment.toString();
        }

        const res = await fetch(url);
        if (!res.body) {
            await ctx.followUp("Error fetching profile picture!");
            return;
        }

        const stream = res.body.pipe(createWriteStream("input.png"));

        await new Promise<void>((res, rej) => {
            stream.on("close", () => {
                res();
            });
            stream.on("error", () => {
                rej();
            });
        });

        await exec(`golden-frame build ${frame} input.png --output=output.png`);
        await ctx.followUp({ files: ["output.png"] });
    }
}
