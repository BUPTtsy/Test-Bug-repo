// 看板运行配置，来自环境变量。
export function loadSettings(env = process.env) {
  const size = Number(env.BUGBOARD_PAGE_SIZE);
  return {
    pageSize: Number.isInteger(size) && size > 0 && size <= 50 ? size : 4,
    exportEnabled: env.BUGBOARD_EXPORT !== 'off',
  };
}
