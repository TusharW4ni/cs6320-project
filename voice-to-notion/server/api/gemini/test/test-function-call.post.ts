export default defineEventHandler(async (event) => {
  // Move the eval call inside the handler function
  const { ntnApiKey } = await readBody(event);
  const result = eval(
    'function testFunctionCall(ntnApiKey) { return "Hello, World!" + ntnApiKey; } testFunctionCall(ntnApiKey);'
  );
  // Return the result of the eval when the handler is invoked
  return result;
});
