var config = {
    dataSource:[],                      // 数据源 Array -> Json
    paramSubcat: "subCat",              // 子选项的属性名 Array -> Json
    paramText: "catName",               // 作为选项显示内容的属性名 String
    paramValue: "catId" || paramText,   // 作为值的属性名  String OR Number
    subcatDeep: 0,                      // 默认全部显示 Number
    isShowAll: true || false,           // 显示交互方式，true表示默认全部显示，false表示默认只显示第一个droplist
    chosenType: "select" || "multi-select" // 单选(默认) OR 多选
}