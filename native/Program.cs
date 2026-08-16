using System.Net.Http;
using System.Text.Json;

var command = args.Length > 0 ? args[0] : "java-paths";
if (command == "java-paths")
{
    var paths = new List<string>();
    var javaHome = Environment.GetEnvironmentVariable("JAVA_HOME");
    if (!string.IsNullOrWhiteSpace(javaHome)) paths.Add(Path.Combine(javaHome, "bin", "java.exe"));
    var path = Environment.GetEnvironmentVariable("PATH") ?? "";
    foreach (var folder in path.Split(';', StringSplitOptions.RemoveEmptyEntries)) paths.Add(Path.Combine(folder, "java.exe"));
    var result = paths.Where(File.Exists).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    Console.WriteLine(JsonSerializer.Serialize(new { java = result, machine = Environment.MachineName }));
}
else if (command == "get")
{
    using var http = new HttpClient();
    var url = args.Length > 1 ? args[1] : "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
    var json = await http.GetStringAsync(url);
    using var doc = JsonDocument.Parse(json);
    Console.WriteLine(JsonSerializer.Serialize(new { status = "ok", rootKind = doc.RootElement.ValueKind.ToString() }));
}
