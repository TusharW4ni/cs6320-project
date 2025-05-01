export default defineEventHandler(async (event) => {
  // Move the eval call inside the handler function
  const result = eval(
    'function testFunctionCall() { return "Hello, World!"; } testFunctionCall();'
  );
  // Return the result of the eval when the handler is invoked
  return result;
});
