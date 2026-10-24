import baseConfig from '@fisch0920/config/oxlint'

export default {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    // This site does not enable the React Compiler, so its immutability and
    // effect rules are optimization hints rather than correctness checks. The
    // patterns they flag here are intentional and long-standing: assigning
    // debug objects onto `window` during render (NotionPage) and the classic
    // `hasMounted` / focus / scroll effects (NotionPageHeader, SearchModal).
    'react/immutability': 'off',
    'react/set-state-in-effect': 'off'
  }
}
