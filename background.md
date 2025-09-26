相关技术说明：
前端:Next.js 14 (React18)+ TypeScript + TailwindCSS
登录:next-auth v5，接入DeepCognition 的 Oauth 外部登陆服务
历史:mongodb 存储对话数据，SSE开发前端流式输出
PDF 解析:pdf-parse(Node 端)+ Uint8Array 直传(前端)
大模型:Claude4(前端直接用 openrouter)
提示词:教育大模型提示词使用/mnt/d/michaelzcy/sjtu/gair/dair/biopaper-app/education_bio_prompt.md
大模型输出制作卡片(可能可额外加):大模型直接回复并生成成 卡片 html2canvas部署:Docker 在火山云上

需求说明：（甲方视角，你可以从中理解需求）
你好，我是xx高中的生物老师毕辰。我现在开设了一门选修课叫从细胞到医学，上课的内容是带学生读一些中英文的医学文献，期末论文是要求学生写一篇文献综述，但是这个对于高一学生来说很难，他们才刚刚学会什么是细胞。所以我向学校申请了电脑教室，想要让学生去在智能体的辅助下去自主阅读学习，比如说让智能体用高中生可以理解的通俗的语言或者类比的方式给他们讲解一些理论作为先验知识，或者展示一些知识卡片，然后让他们再带着理解去阅读文献。如果有合适的智能体请您推荐给我，我的课程是一个很不错的应用场景