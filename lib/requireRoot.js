global.requireRoot = (module) => {
  if (String(module).startsWith("/"))
    return require(process.mainModule.paths[0].split('node_modules')[0].slice(0, -1) + module);
  return require(module);
}
