# Flutter Clean Architecture Integration Guide (Bio-data/Profile & Auth)

This guide details how to integrate your Backend API with a Flutter application using **Clean Architecture** and **Hive** for local caching.

## 1. Project Structure

Organize your feature (e.g., `auth`, `profile`) into the standard Clean Architecture layers:

```text
lib/
├── core/
│   ├── error/              # Failures & Exceptions
│   ├── network/            # NetworkInfo, API Client (Dio)
│   ├── usecases/           # Base UseCase interface
│   └── services/           # Hive Service, Service Locator
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── auth_remote_data_source.dart
│   │   │   │   └── auth_local_data_source.dart
│   │   │   ├── models/
│   │   │   │   └── user_model.dart (extends Entity, HiveAdapter)
│   │   │   └── repositories/
│   │   │   │   └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user_entity.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── login_usecase.dart
│   │   │       └── register_usecase.dart
│   │   └── presentation/   # BLoC/Providers & UI
│   └── profile/
│       ├── data/
│       │   ├── datasources/
│       │   │   ├── profile_remote_data_source.dart
│       │   │   └── profile_local_data_source.dart
│       │   ├── models/
│       │   │   └── profile_model.dart
│       │   └── repositories/
│       │   │   └── profile_repository_impl.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   └── profile_entity.dart
│       │   ├── repositories/
│       │   │   └── profile_repository.dart
│       │   └── usecases/
│       │       ├── get_profile_usecase.dart
│       │       └── update_profile_usecase.dart
│       └── presentation/
```

---

## 2. Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  dio: ^5.0.0              # HTTP Client
  hive: ^2.2.3             # Local DB
  hive_flutter: ^1.1.0
  dartz: ^0.10.1           # Functional Programming (Either)
  equatable: ^2.0.5        # Value equality
  get_it: ^7.6.0           # Dependency Injection
  flutter_bloc: ^8.1.3     # State Management (recommended)
  
dev_dependencies:
  hive_generator: ^2.0.0
  build_runner: ^2.3.3
```

---

## 3. Core Network Client (Dio)

Setup a singleton Dio client that attaches the JWT token automatically using Interceptors.

```dart
// core/network/api_client.dart
class ApiClient {
  final Dio dio;
  final AuthLocalDataSource authLocalDataSource;

  ApiClient({required this.dio, required this.authLocalDataSource}) {
    dio.options.baseUrl = 'http://10.0.2.2:3000/api'; // Android Emulator
    dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await authLocalDataSource.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }
}
```

---

## 4. Feature: Authentication (Auth)

### Domain Layer

**Entity (`auth/domain/entities/auth_user.dart`)**
```dart
class AuthUser extends Equatable {
  final String id;
  final String email;
  final String name;

  const AuthUser({required this.id, required this.email, required this.name});

  @override
  List<Object?> get props => [id, email, name];
}
```

**Repository Interface (`auth/domain/repositories/auth_repository.dart`)**
```dart
abstract class AuthRepository {
  Future<Either<Failure, AuthUser>> login(String email, String password);
  Future<Either<Failure, AuthUser>> register(String name, String email, String password);
}
```

### Data Layer

**Model (`auth/data/models/auth_user_model.dart`)**
*Use Hive type adapters.*

```dart
import 'package:hive/hive.dart';
part 'auth_user_model.g.dart';

@HiveType(typeId: 0)
class AuthUserModel extends AuthUser {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String email;
  @HiveField(2)
  final String name;
  @HiveField(3)
  final String token; // Store token here for easy caching

  const AuthUserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.token,
  }) : super(id: id, email: email, name: name);

  factory AuthUserModel.fromJson(Map<String, dynamic> json) {
    return AuthUserModel(
      id: json['user']['id'],
      email: json['user']['email'],
      name: json['user']['name'],
      token: json['token'],
    );
  }
}
```

**Local Data Source (`auth/data/datasources/auth_local_data_source.dart`)**

```dart
abstract class AuthLocalDataSource {
  Future<void> cacheUser(AuthUserModel user);
  Future<String?> getToken();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final Box box;
  
  AuthLocalDataSourceImpl(this.box);

  @override
  Future<void> cacheUser(AuthUserModel user) async {
    await box.put('CACHED_USER', user);
    await box.put('CACHED_TOKEN', user.token);
  }

  @override
  Future<String?> getToken() async {
    return box.get('CACHED_TOKEN');
  }
}
```

**Remote Data Source (`auth/data/datasources/auth_remote_data_source.dart`)**

```dart
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio dio;

  AuthRemoteDataSourceImpl(this.dio);

  @override
  Future<AuthUserModel> login(String email, String password) async {
    final response = await dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return AuthUserModel.fromJson(response.data);
  }
  // Implement register similarly...
}
```

**Repository Implementation**
Coordinator between Remote and Local.

```dart
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final AuthLocalDataSource localDataSource;

  AuthRepositoryImpl({required this.remoteDataSource, required this.localDataSource});

  @override
  Future<Either<Failure, AuthUser>> login(String email, String password) async {
    try {
      final userModel = await remoteDataSource.login(email, password);
      // Cache the result
      await localDataSource.cacheUser(userModel);
      return Right(userModel);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
```

---

## 5. Feature: Profile

This is where the user updates their bio-data and we use `MultipartFile` for images.

### Domain Layer

**Entity (`profile/domain/entities/profile.dart`)**
```dart
class Profile extends Equatable {
  final String id;
  final String name;
  final String email;
  final String? profilePicture;
  final String? phoneNumber;
  final String? studentId;
  final String? batch;

  // ... constructor & props
}
```

### Data Layer

**Model (`profile/data/models/profile_model.dart`)**

```dart
@HiveType(typeId: 1)
class ProfileModel extends Profile {
  // Add HiveFields
  
  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: json['data']['id'] ?? json['id'],
      name: json['data']['name'] ?? json['name'],
      // ... map other fields
    );
  }
}
```

**Remote Data Source - Image Upload (`profile/data/datasources/profile_remote_data_source.dart`)**

```dart
abstract class ProfileRemoteDataSource {
  Future<ProfileModel> getProfile();
  Future<ProfileModel> updateProfile(Map<String, dynamic> body, File? imageFile);
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final Dio dio;

  ProfileRemoteDataSourceImpl(this.dio);

  @override
  Future<ProfileModel> updateProfile(Map<String, dynamic> body, File? imageFile) async {
    FormData formData = FormData.fromMap(body);

    if (imageFile != null) {
      formData.files.add(MapEntry(
        'profilePicture',
        await MultipartFile.fromFile(imageFile.path),
      ));
    }

    final response = await dio.patch('/profile', data: formData);
    return ProfileModel.fromJson(response.data);
  }
}
```

**Local Data Source**
Cache the profile so the user sees their data offline immediately.

```dart
class ProfileLocalDataSourceImpl implements ProfileLocalDataSource {
  final Box box;

  @override
  Future<void> cacheProfile(ProfileModel profile) async {
    await box.put('CACHED_PROFILE', profile);
  }

  @override
  Future<ProfileModel> getLastProfile() async {
    final profile = box.get('CACHED_PROFILE');
    if (profile != null) return profile;
    throw CacheException();
  }
}
```

**Repository Implementation**
Strategy: Try Remote -> If successful, Cache it -> Return. If Remote fails -> Return Cached Data (if available).

```dart
class ProfileRepositoryImpl implements ProfileRepository {
  // ... dependencies

  @override
  Future<Either<Failure, Profile>> getProfile() async {
    if (await networkInfo.isConnected) {
      try {
        final remoteProfile = await remoteDataSource.getProfile();
        localDataSource.cacheProfile(remoteProfile);
        return Right(remoteProfile);
      } catch (e) {
        return Left(ServerFailure());
      }
    } else {
      try {
        final localProfile = await localDataSource.getLastProfile();
        return Right(localProfile);
      } catch (e) {
        return Left(CacheFailure());
      }
    }
  }
}
```

## 6. Initialization (main.dart)

1. **Hive Init**: Initialize Hive and register adapters.
2. **Dependency Injection**: Setup `GetIt` for Repositories and BLoCs.

```dart
void main() async {
  await Hive.initFlutter();
  Hive.registerAdapter(AuthUserModelAdapter());
  Hive.registerAdapter(ProfileModelAdapter());
  
  await Hive.openBox('authBox');
  await Hive.openBox('profileBox');
  
  setupLocator(); // GetIt setup
  
  runApp(MyApp());
}
```
