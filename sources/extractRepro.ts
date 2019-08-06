import remark from 'remark';
import visit  from 'unist-util-visit';

export function extractRepro(markdown: string) {
    let code: string | null = null;

    function processCode() {
		return (ast: any) => {
			visit(ast, `code`, node => {
                if (node.meta === `repro` && typeof node.value === `string`) {
                    code = node.value;
                }
			});
		};
	}

    remark()
        // @ts-ignore
		.use(processCode)
        .processSync(markdown);

    return code as string | null;
};
