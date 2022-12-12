import fetch from "node-fetch";
import { createWriteStream } from "node:fs";

import { CocoaVersion, getElapsed } from "cocoa-discord-utils/meta";
import {
  CogSlashClass,
  SlashCommand,
  Param,
} from "cocoa-discord-utils/slash/class";
import { getStatusFields } from "cocoa-discord-utils/template";

import { Version as MusicVersion } from "@leomotors/music-bot";

import { exec } from "../utils/index.js";

import { style } from "./style.js";

export class MainCog extends CogSlashClass {
  private timePinged = 0;

  constructor() {
    super("Main Cog", "Main Cog of this bot");
  }

  @SlashCommand("Pong!")
  async ping(ctx: SlashCommand.Context) {
    await ctx.reply(
      `Pong! Respond took ${getElapsed(
        ctx.createdAt
      )} ms. Since start, I have been pinged ${++this.timePinged} times!`
    );
  }

  @SlashCommand("Get Bot's Status")
  async status(
    ctx: SlashCommand.Context,
    @Param.Ephemeral ephemeral: Param.Ephemeral.Type
  ) {
    const emb = style
      .use(ctx)
      .setTitle("C--'s Status")
      .setDescription(
        `[C--](https://github.com/Leomotors/cminusminus) Bot Version: ${process.env.npm_package_version}\n[Cocoa Discord Utils](https://github.com/Leomotors/cocoa-discord-utils) Version: ${CocoaVersion}\n[@leomotors/music-bot](https://github.com/Leomotors/music-bot) Version: ${MusicVersion}`
      )
      .addFields(await getStatusFields(ctx));

    await ctx.reply({ embeds: [emb], ephemeral: ephemeral ?? false });
  }

  @SlashCommand("Create Golden Frame")
  async goldenframe(
    ctx: SlashCommand.Context,
    @Param.Choices<Param.String.Type>(async () =>
      (await exec("golden-frame list")).stdout
        .split("\n")
        .slice(1)
        .filter((l) => l.length)
        .map((e) => e.split(" ")[0]!.trim())
        .map((e) => ({ name: e, value: e }))
    )
    @Param.String("Frame Name")
    frame: Param.String.Type,
    @Param.User("Who to put in the golden frame", { required: false })
    who: Param.User.Nullable,
    @Param.Attachment("Image to put in the frame", { required: false })
    img: Param.Attachment.Nullable
  ) {
    if (!who && !img) {
      await ctx.reply("Either user or image must be given!");
      return;
    }

    await ctx.deferReply();

    let url: string | null;
    if (who) {
      url = who.avatarURL({ size: 4096 });
      if (!url) {
        await ctx.followUp(
          "Cannot Golden Frame: Target user has no profile picture!"
        );
        return;
      }
    } else {
      url = img!.attachment.toString();
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
