import { NextRequest, NextResponse } from 'next/server';
import { checkNavigationAccess, mockMenus } from '@/lib/accessControl';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'f2000000-0000-0000-0000-000000000002';

    // Filter menus that the user is allowed to view
    const allowedMenus: any[] = [];
    for (const menu of mockMenus) {
      const isAllowed = await checkNavigationAccess(userId, menu.id);
      if (isAllowed) {
        allowedMenus.push(menu);
      }
    }

    // Now organize them into a 3-tier hierarchy: Module -> Submodule -> Tab
    const modules = allowedMenus.filter(m => m.parentId === null);
    const submodules = allowedMenus.filter(m => m.parentId !== null && allowedMenus.some(p => p.id === m.parentId && p.parentId === null));
    const tabs = allowedMenus.filter(m => m.parentId !== null && allowedMenus.some(p => p.id === m.parentId && p.parentId !== null));

    // Construct the structured response
    const hierarchy = modules.map(mod => {
      const subItems = submodules
        .filter(sub => sub.parentId === mod.id)
        .map(sub => {
          const tabItems = tabs.filter(t => t.parentId === sub.id);
          return {
            ...sub,
            tabs: tabItems
          };
        });

      return {
        ...mod,
        submodules: subItems
      };
    });

    // If a module has no allowed submodules or tabs, filter it out (except if it has no children defined at all)
    const filteredHierarchy = hierarchy.filter(mod => {
      const hasChildrenConfigured = mockMenus.some(m => m.parentId === mod.id);
      if (!hasChildrenConfigured) return true;
      return mod.submodules.length > 0;
    });

    return NextResponse.json(filteredHierarchy);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
