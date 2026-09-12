# 独立 Agent 目标项目

这个目录是 BugBoard 控制台之外的本地测试夹具。TraceFix 会把它复制到
`.tracefix/demo-repo`，在隔离工作区中注入缺陷并执行 Agent Run。

请不要把控制台的 `demo/bugboard` 当成 Agent 的目标仓库。真实端到端测试应当
使用一个单独的 GitHub fork，并通过项目配置显式指定仓库和验证命令。
