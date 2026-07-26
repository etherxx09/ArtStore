import type { UserConfig } from '@tarojs/cli'

const config: UserConfig = {
  projectName: 'gallery-mini',
  date: '2026-07-26',
  framework: 'react',
  designWidth: 375,
  deviceRatio: {
    640: 2.34,
    750: 2,
    828: 1.795,
    375: 1,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-platform-h5'],
  compiler: {
    prebundle: {
      enable: false,
    },
  },
  h5: {
    devServer: {
      port: 10086,
    },
  },
}

export default config
