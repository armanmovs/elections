module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    develop: {
      port: 8545
    }
  },
  // Добавляем конфигурацию для компилятора Solidity
  compilers: {
    solc: {
      version: "0.8.0", // Версия компилятора, которую требует ваш контракт
    }
  }
};
