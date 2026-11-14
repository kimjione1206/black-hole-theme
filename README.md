# Black Hole

A backdrop for the Claude desktop app. It puts a black hole in the upper right of the window, behind the chat, on a dark sky with a few slow stars.

The disk of gas around it turns, quicker near the middle and slower at the rim, and bright clumps in it flare and fade the way hot gas does around a real one. About once a minute a small ship drifts in from the right, circles closer and faster, stretches thin and drops in.

I made it because the theme examples that come with Claude had a night sky and an aurora but no black hole.

## Use

The backdrop is on as soon as the plugin is installed, in every new session.

- `/blackhole` turns it on
- `/blackhole off` clears it for the current session

It is drawn for dark windows. In a light window the text is hard to read.

## Install

At the prompt of a terminal session:

```
/plugin install black-hole --marketplace kimjione1206/black-hole-theme
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install black-hole --marketplace kimjione1206/black-hole-theme
```

In the desktop app, where `/plugin` does not run, click + next to the prompt box, then Plugins, then Add marketplace with `kimjione1206/black-hole-theme`, then Add plugin.

## What it does and what it leaves alone

It sets the session's backdrop and registers one command, and that is all. It reads nothing from your prompts or your files, stores nothing and sends nothing anywhere.

The plugin is a mod, a small module that Claude Code loads. These are the only calls it makes, all of them Claude Code's own:

- `$.theme.set` when a session starts and when you type `/blackhole`. It hands Claude Code the name of the scene and how much to frost the panels over it. Nothing leaves your machine.
- `$.theme.clear` when you type `/blackhole off`. It puts the app's own look back.
- `$.command.register` once per session, to add the `/blackhole` command.
- `$.ui.resolve` while drawing, to get the app's own `Svg` element.

It hooks three events. `session.start` sets the backdrop. `command.run`, for the `/blackhole` command alone, turns the backdrop on or off and answers with one line. `ui.render` for the backdrop returns the picture. The only thing it reads from you is the word after `/blackhole`, to see whether it is `off`.

The whole picture is one SVG built in `hooks/scene.ts` and animated with CSS. There are no images, no fonts and no scripts in it, and it holds still when your system asks for reduced motion.

It needs a version of Claude Desktop that draws a plugin's backdrop behind the chat. A terminal session shows nothing.

The ship is my own drawing and is not taken from any film.

## License

MIT. The full text is in the LICENSE file.
