﻿using System.Collections.Generic;
using System.Threading;
using System.Xml.Linq;
using Composite.Core.Xml;
using Composite.Functions;
using Composite.Plugins.Functions.FunctionProviders.StandardFunctionProvider.Foundation;
using Composite.Core.WebClient.Renderings.Template;

namespace Composite.Plugins.Functions.FunctionProviders.StandardFunctionProvider.Web.Html.Template
{
    internal sealed class PageTemplateFeatureFunction : StandardFunctionBase
    {
        public PageTemplateFeatureFunction(EntityTokenFactory entityTokenFactory)
            : base("PageTemplateFeature", "Composite.Web.Html.Template", typeof(XhtmlDocument), entityTokenFactory)
        {
        }



        protected override IEnumerable<StandardFunctionParameterProfile> StandardFunctionParameterProfiles
        {
            get
            {
                WidgetFunctionProvider featureNameSelector =
                    StandardWidgetFunctions.DropDownList(
                        this.GetType(),
                        "FeatureNames",
                        false,
                        true);

                yield return new StandardFunctionParameterProfile(
                    "FeatureName",
                    typeof(string),
                    true,
                    new NoValueValueProvider(),
                    featureNameSelector);
            }
        }


        public static IEnumerable<string> FeatureNames()
        {
            return PageTemplateFeatureFacade.FeatureNames;
        }


        public override object Execute(ParameterList parameters, FunctionContextContainer context)
        {
            string featureName = parameters.GetParameter<string>("FeatureName");

            return PageTemplateFeatureFacade.GetPageTemplateFeature(featureName);
        }
    }
}
