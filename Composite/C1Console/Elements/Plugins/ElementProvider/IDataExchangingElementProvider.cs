﻿

namespace Composite.C1Console.Elements.Plugins.ElementProvider
{
    internal interface IDataExchangingElementProvider : IHooklessElementProvider
    {
        object GetData(string name);
    }
}
