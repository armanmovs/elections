var Voting = artifacts.require("Voting");

module.exports = function(deployer) {
  // Список кандидатов для передачи в конструктор
  const candidates = ["Candidate 1", "Candidate 2"]; // У вас два кандидата

  // Развертывание контракта с передачей списка кандидатов
  deployer.deploy(Voting, candidates);
};
