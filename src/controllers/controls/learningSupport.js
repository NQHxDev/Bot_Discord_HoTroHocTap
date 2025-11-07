const handlingMessagesLearningSupport = (message) => {
   if (message.content === '!helpme') {
      message.channel.send('Learning support is already!');
   }
};

export default handlingMessagesLearningSupport;
