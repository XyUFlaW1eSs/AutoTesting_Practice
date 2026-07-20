import os
from dotenv import load_dotenv

# 1. 默认先加载根目录下的基础 .env 文件（用来决定去跑哪个环境）
load_dotenv()

# 获取当前要运行的目标环境，默认为 local
TARGET_ENV = os.getenv("TEST_ENV", "local").lower()
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. 根据目标环境，动态加载对应环境的敏感配置文件
env_file = f"{ROOT_DIR}\\.env.{TARGET_ENV}"
if os.path.exists(env_file):
    print(f"[Config] 正在加载环境配置文件: {env_file}")
    # override=True 表示用当前环境文件的内容覆盖之前读取的默认值
    load_dotenv(dotenv_path=env_file, override=True)
else:
    print(f"[Config] 警告: 未找到环境配置文件 {env_file}，将尝试使用系统环境变量。")

class Config:
    # 基础运行环境属性
    ENV = TARGET_ENV
    
    # ====== 核心：各环境通用的账户与密码（值会根据动态加载的 .env 自动改变） ======
    ADMIN_USER = os.getenv("ADMIN_USER")
    ADMIN_PASS = os.getenv("ADMIN_PASS")
    
    DB_USER = os.getenv("DB_USER")
    DB_PASS = os.getenv("DB_PASS")

    # ====== 根据环境动态切换对应的服务 URL ======
    @property
    def BASE_API_URL(self) -> str:
        if self.ENV == "local":
            return "http://localhost:5289"
        elif self.ENV == "dev":
            return "http://dev-api.autotest.platform"
        else:
            return "http://staging-api.autotest.platform"

    @property
    def BASE_UI_URL(self) -> str:
        if self.ENV == "local":
            return "http://localhost:5173"
        elif self.ENV == "dev":
            return "http://dev.autotest.platform"
        else:
            return "http://staging.autotest.platform"

# 实例化全局单例
settings = Config()