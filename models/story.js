'use strict';
module.exports = function(sequelize, DataTypes) {
  var story = sequelize.define('story', {
    title: DataTypes.TEXT,
    given: DataTypes.TEXT,
    when: DataTypes.TEXT,
    and: DataTypes.TEXT,
    then: DataTypes.TEXT,
    userId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        models.story.belongsTo(models.user);
      }
    },
    instanceMethods: {
      getFullStory: function() {
        return 'Given ' + this.given + '<br />' + 'When ' + this.when + '<br /> ' + 'And ' + this.and + '<br /> ' + 'Then ' + this.then;
      }
    }
  });
  return story;
};
