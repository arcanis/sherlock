// We must disable them otherwise Jest (`expect`) will use terminal code in the stacktrace :(
process.env.FORCE_COLOR = `0`;

require(`./cli`);
