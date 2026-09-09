export const guideFields = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  description,
  category,
  status,
  order,
  searchKeywords,
  body[]{
    ...,
    _type == "contentImage" => {
      ...,
      "assetUrl": asset.asset->url
    },
    _type == "contentVideo" => {
      ...,
      "assetUrl": file.asset->url
    },
    _type == "callout" => {
      ...,
      content[]{
        ...,
        _type == "contentImage" => {
          ...,
          "assetUrl": asset.asset->url
        }
      }
    },
    _type == "detailsBlock" => {
      ...,
      content[]{
        ...,
        _type == "contentImage" => {
          ...,
          "assetUrl": asset.asset->url
        }
      }
    },
    _type == "repeatedItemGrid" => {
      ...,
      items[]{
        ...,
        image{
          ...,
          "assetUrl": asset.asset->url
        },
        content[]{
          ...,
          _type == "contentImage" => {
            ...,
            "assetUrl": asset.asset->url
          }
        }
      }
    }
  },
  sections[]{
    ...,
    blocks[]{
      ...,
      _type == "contentImage" => {
        ...,
        "assetUrl": asset.asset->url
      },
      _type == "contentVideo" => {
        ...,
        "assetUrl": file.asset->url
      },
      _type == "callout" => {
        ...,
        content[]{
          ...,
          _type == "contentImage" => {
            ...,
            "assetUrl": asset.asset->url
          }
        }
      },
      _type == "detailsBlock" => {
        ...,
        content[]{
          ...,
          _type == "contentImage" => {
            ...,
            "assetUrl": asset.asset->url
          }
        }
      },
      _type == "repeatedItemGrid" => {
        ...,
        items[]{
          ...,
          image{
            ...,
            "assetUrl": asset.asset->url
          },
          content[]{
            ...,
            _type == "contentImage" => {
              ...,
              "assetUrl": asset.asset->url
            }
          }
        }
      }
    }
  }
`;

export const glossaryFields = /* groq */ `
  _id,
  term,
  legacyId,
  category,
  aliases,
  order,
  definition[]{
    ...,
    _type == "contentImage" => {
      ...,
      "assetUrl": asset.asset->url
    },
    _type == "callout" => {
      ...,
      content[]{
        ...,
        _type == "contentImage" => {
          ...,
          "assetUrl": asset.asset->url
        }
      }
    }
  }
`;

export const allGuidesQuery = /* groq */ `*[_type == "guide"]|order(order asc){${guideFields}}`;
export const guideBySlugQuery = /* groq */ `*[_type == "guide" && slug.current == $slug][0]{${guideFields}}`;
export const glossaryQuery = /* groq */ `*[_type == "glossaryEntry"]|order(order asc){${glossaryFields}}`;
export const siteSettingsQuery = /* groq */ `
  *[_id == "siteSettings"][0]{
    updates[]{..., _key},
    usefulLinks[]{..., _key},
    popularGuides[]->{
      ${guideFields}
    }
  }
`;
