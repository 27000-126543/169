## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A["React SPA 应用"]
        A1["全国总览看板"]
        A2["矿区下钻详情"]
        A3["预警管理中心"]
        A4["地质风险分析"]
        A5["报表诊断中心"]
    end

    subgraph "数据层"
        B["Mock数据服务"]
        B1["矿区/工作面数据"]
        B2["实时监测数据流"]
        B3["预警与审批数据"]
        B4["地质风险数据"]
        B5["报表统计数据"]
    end

    subgraph "可视化层"
        C["ECharts 图表引擎"]
        C1["热力图/地图"]
        C2["折线图/柱状图"]
        C3["饼图/环形图"]
        C4["轨迹热力图"]
    end

    subgraph "工具层"
        D["XLSX 解析库"]
        D1["Excel文件读取"]
        D2["地质数据提取"]
    end

    A --> B
    A --> C
    A --> D
    A1 --> B1
    A1 --> C1
    A2 --> B2
    A2 --> C2
    A2 --> C4
    A3 --> B3
    A4 --> B4
    A4 --> D1
    A5 --> B5
    A5 --> C3
```

## 2. 技术说明
- **前端框架**：React@18 + TypeScript + Vite
- **样式方案**：Tailwind CSS@3
- **图表库**：ECharts@5（热力图、折线图、饼图、地图等）
- **路由**：React Router@6
- **状态管理**：Zustand
- **Excel解析**：SheetJS (xlsx)
- **初始化工具**：Vite
- **后端**：无，使用Mock数据模拟
- **数据库**：无，前端本地Mock数据

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| `/` | 全国安全总览看板，含热力图和核心指标 |
| `/mine/:mineId` | 矿区下钻详情页，展示工作面监测数据 |
| `/alerts` | 预警管理中心，预警列表与审批流程 |
| `/geology` | 地质风险分析页，上传报告与风险预测 |
| `/reports` | 报表诊断中心，周报与统计分析 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    Province ||--o{ Mine : "包含"
    Mine ||--o{ WorkingFace : "包含"
    Mine ||--o{ Alert : "产生"
    WorkingFace ||--o{ MonitoringData : "采集"
    WorkingFace ||--o{ PersonnelTrack : "记录"
    WorkingFace ||--o{ Violation : "记录"
    Alert ||--o{ ApprovalStep : "审批"
    GeologicalReport ||--o{ RiskPoint : "提取"

    Province {
        string id PK
        string name
        float safetyIndex
    }

    Mine {
        string id PK
        string name
        string provinceId FK
        float safetyIndex
        float equipmentUptimeRate
        float violationRate
        float gasOverlimitDuration
    }

    WorkingFace {
        string id PK
        string name
        string mineId FK
        string status
        float gasConcentration
        float dustLevel
        float fanStatus
        float vibrationLevel
    }

    MonitoringData {
        string id PK
        string faceId FK
        string type
        float value
        datetime timestamp
    }

    PersonnelTrack {
        string id PK
        string faceId FK
        string personId
        float x
        float y
        datetime timestamp
    }

    Violation {
        string id PK
        string faceId FK
        string type
        string personId
        datetime timestamp
    }

    Alert {
        string id PK
        string mineId FK
        string faceId FK
        string level
        string type
        string status
        datetime triggeredAt
    }

    ApprovalStep {
        string id PK
        string alertId FK
        string role
        string approver
        string status
        datetime approvedAt
    }

    GeologicalReport {
        string id PK
        string mineId FK
        string fileName
        datetime uploadedAt
    }

    RiskPoint {
        string id PK
        string reportId FK
        string type
        float x
        float y
        string description
    }
```

### 4.2 Mock数据策略
- 矿区数据：覆盖山西、陕西、内蒙古、贵州、河南、安徽、山东、新疆等主要产煤省份，每省2-3个矿区
- 工作面数据：每个矿区3-5个工作面，含实时监测值
- 监测时序数据：生成近7天的分钟级瓦斯浓度数据
- 人员轨迹：生成工作面区域内的模拟轨迹点
- 预警数据：包含各级别预警实例
- 报表数据：按周生成近4周的诊断统计数据
