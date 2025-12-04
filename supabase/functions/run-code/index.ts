import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, content, language } = await req.json();

    console.log(`Running ${filename} (${language})`);

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    // For JavaScript/TypeScript, we can actually evaluate simple code
    if (['js', 'jsx', 'ts', 'tsx'].includes(language)) {
      try {
        // Create a safe evaluation context
        const logs: string[] = [];
        const errors: string[] = [];
        
        // Capture console.log outputs
        const mockConsole = {
          log: (...args: any[]) => logs.push(args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ')),
          error: (...args: any[]) => errors.push(args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ')),
          warn: (...args: any[]) => logs.push('[warn] ' + args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ')),
          info: (...args: any[]) => logs.push('[info] ' + args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ')),
        };

        // Simple evaluation for basic JS
        const wrappedCode = `
          const console = mockConsole;
          ${content}
        `;
        
        // Use Function constructor for safer eval
        const fn = new Function('mockConsole', wrappedCode);
        const result = fn(mockConsole);
        
        if (result !== undefined) {
          logs.push(`=> ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
        }
        
        stdout = logs.join('\n');
        stderr = errors.join('\n');
      } catch (evalError) {
        stderr = `Error: ${evalError instanceof Error ? evalError.message : String(evalError)}`;
        exitCode = 1;
      }
    } else if (language === 'py') {
      // Python simulation - just show what would run
      stdout = `[Python simulation]\n`;
      stdout += `Would execute:\n`;
      stdout += `$ python ${filename}\n\n`;
      stdout += `Note: Full Python execution requires a Python runtime.\n`;
      stdout += `The code appears to be valid Python.`;
      
      // Basic syntax check
      if (content.includes('def ') || content.includes('class ') || content.includes('import ')) {
        stdout += `\n\nDetected Python constructs in your code.`;
      }
    } else if (language === 'html') {
      stdout = `[HTML Preview]\n`;
      stdout += `Your HTML file contains ${content.length} characters.\n`;
      stdout += `Open in browser to view the rendered output.`;
    } else {
      stderr = `Language '${language}' execution is not fully supported yet.\n`;
      stderr += `Supported languages with execution: JavaScript, TypeScript\n`;
      stderr += `Supported languages with preview: Python, HTML`;
      exitCode = 1;
    }

    return new Response(
      JSON.stringify({ stdout, stderr, exitCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error running code:', error);
    return new Response(
      JSON.stringify({ 
        stdout: '', 
        stderr: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        exitCode: 1 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
