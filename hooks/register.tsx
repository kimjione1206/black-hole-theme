import type { Register, ThemeSetArgs } from 'claude-code'

import { blackHoleSvg } from './scene'

const SCENE = 'black-hole'
const COMMAND = 'blackhole'

const LOOK: ThemeSetArgs = {
  backdrop: { scene: SCENE, glass: { blur: 14, tint: '#07061a', opacity: 0.32 } },
  overrideColorScheme: 'dark',
}

export const register: Register = on => {
  // Every session starts with the black hole behind the chat.
  on('session.start', async ($, e, next) => {
    await $.theme.set(LOOK)
    await $.command.register({
      name: COMMAND,
      description: 'A black hole behind the chat: alone it turns the backdrop on, "off" clears it.',
    })

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    if (e.args.trim().toLowerCase() === 'off') {
      await $.theme.clear()

      return { text: '블랙홀 배경을 껐어요. 다시 켜려면 /blackhole' }
    }

    const set = await $.theme.set(LOOK)

    return {
      text: set.isDrawn
        ? '블랙홀 배경을 켰어요. 어두운 화면용이에요. 끄려면 /blackhole off'
        : `블랙홀 배경을 걸었지만 이 창은 아직 그리지 못해요 (${set.reason})`,
    }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.scene !== SCENE || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg isInteractive alt="A black hole with a glowing disk of gas on a starry sky" source={blackHoleSvg()} />
  })
}
