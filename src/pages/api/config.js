export default function handler(req, res) {
  res.status(200).json({
    yamlGeneratorUrl: process.env.YAML_GENERATOR_URL || 'https://yaml-generator-back.onechart.dev'
  })
}
