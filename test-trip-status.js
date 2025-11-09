// 测试脚本：检查旅行状态和完成按钮显示
console.log('=== 测试旅行状态和完成按钮 ===');

// 模拟旅行数据 - 使用新的数字状态系统
const testTrips = [
  {
    id: '1',
    title: '测试旅行 - 规划中',
    description: '这是一个规划中的旅行',
    destination: '北京',
    startDate: '2025-01-01',
    endDate: '2025-01-05',
    duration: 5,
    budget: 5000,
    status: 0, // 0: 规划中
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: '测试旅行 - 已完成',
    description: '这是一个已完成的旅行',
    destination: '上海',
    startDate: '2025-02-01',
    endDate: '2025-02-05',
    duration: 5,
    budget: 6000,
    status: 1, // 1: 已完成
    createdAt: new Date().toISOString()
  }
];

console.log('测试数据:');
testTrips.forEach(trip => {
  console.log(`- ${trip.title}: 状态=${trip.status} (${trip.status === 0 ? '规划中' : '已完成'})`);
});

console.log('\n预期行为:');
console.log('- 状态=0 (规划中) 的旅行应该显示绿色"完成"按钮');
console.log('- 状态=1 (已完成) 的旅行应该显示蓝色"重新规划"按钮');
console.log('- 新建旅行默认状态应该是 0 (规划中)');

console.log('\n检查 TripModel 中的默认状态设置:');
console.log('- 在 Trip.js 第18行: this.status = data.status || 0');
console.log('- 这意味着新建旅行默认状态为规划中 (0)');

console.log('\n检查 TripList 中的按钮逻辑:');
console.log('- 当 trip.status === 0 时显示"完成"按钮');
console.log('- 当 trip.status === 1 时显示"重新规划"按钮');

console.log('\n状态系统更新:');
console.log('- 状态现在使用数字: 0=规划中, 1=已完成');
console.log('- 移除了调试信息显示');
console.log('- 过滤器现在使用数字状态');

console.log('\n可能的问题:');
console.log('1. 旅行数据中没有 status 字段');
console.log('2. status 字段值不是预期的 0 或 1');
console.log('3. 旅行数据没有正确传递给 TripList 组件');
console.log('4. 浏览器缓存问题');

console.log('\n建议的调试步骤:');
console.log('1. 在浏览器控制台检查旅行数据');
console.log('2. 确认每个旅行项的 status 字段值');
console.log('3. 检查 TripList 组件是否正确接收到数据');
